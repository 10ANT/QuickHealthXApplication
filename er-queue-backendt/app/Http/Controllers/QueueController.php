<?php
namespace App\Http\Controllers;

use App\Models\QueueEntry;
use App\Models\User;
use App\Models\DoctorSession;
use App\Events\QueueUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class QueueController extends Controller
{
    public function index()
    {
        $queueEntries = QueueEntry::with(['triage.patient'])
            ->where('status', 'WAITING')
            ->orderBy('urgency_score', 'desc')
            ->orderBy('entry_time', 'asc')
            ->get();

        return response()->json($queueEntries);
    }

    public function assignPatient(Request $request)
    {
        $request->validate([
            'doctor_id' => 'required|exists:users,id',
        ]);

        $doctorId = $request->doctor_id;

        DB::beginTransaction();
        try {
            $doctor = User::findOrFail($doctorId);

            if ($doctor->role !== 'DOCTOR') {
                return response()->json(['message' => 'User is not a doctor'], 400);
            }

            if (!$doctor->available) {
                return response()->json(['message' => 'Doctor is not available'], 400);
            }

            // Find highest priority patient
            $queueEntry = QueueEntry::with(['triage.patient'])
                ->where('status', 'WAITING')
                ->orderBy('urgency_score', 'desc')
                ->orderBy('entry_time', 'asc')
                ->first();

            if (!$queueEntry) {
                return response()->json(['message' => 'No patients in queue'], 404);
            }

            // Update queue entry status
            $queueEntry->status = 'IN_SESSION';
            $queueEntry->save();

            // Mark doctor as unavailable
            $doctor->available = false;
            $doctor->save();

            // Create doctor session
    $session = DoctorSession::create([
                'doctor_id' => $doctorId,
                'patient_id' => $queueEntry->triage->patient_id,
                'start_time' => Carbon::now(),
            ]);

            DB::commit();

            // Broadcast queue update event
            broadcast(new QueueUpdated())->toOthers();

            return response()->json([
                'session' => $session,
                'patient' => $queueEntry->triage->patient,
                'triage' => $queueEntry->triage,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error assigning patient: ' . $e->getMessage()], 500);
        }
    }

    public function getCurrentSession(Request $request)
    {
        $userId = $request->user()->id;

        $session = DoctorSession::with(['patient', 'patient.triages' => function($query) {
                $query->latest();
            }])
            ->where('doctor_id', $userId)
            ->whereNull('end_time')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'No active session'], 404);
        }

        return response()->json($session);
    }

    public function completeSession(Request $request)
    {
        $request->validate([
            'session_id' => 'required|exists:doctor_sessions,id',
            'medical_notes' => 'required|string',
        ]);

        DB::beginTransaction();
        try {
            $session = DoctorSession::findOrFail($request->session_id);

            if ($session->doctor_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized to complete this session'], 403);
            }

            if ($session->end_time !== null) {
                return response()->json(['message' => 'Session already completed'], 400);
            }

            // Update session
            $session->end_time = Carbon::now();
            $session->medical_notes = $request->medical_notes;
            $session->save();

            // Update queue entry status
            $queueEntry = QueueEntry::whereHas('triage', function($query) use ($session) {
                $query->where('patient_id', $session->patient_id);
            })->where('status', 'IN_SESSION')->first();

            if ($queueEntry) {
                $queueEntry->status = 'COMPLETED';
                $queueEntry->save();
            }

            // Make doctor available again
            $doctor = User::find($session->doctor_id);
            $doctor->available = true;
            $doctor->save();

            DB::commit();

            // Broadcast queue update event
            broadcast(new QueueUpdated())->toOthers();

            return response()->json($session);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error completing session: ' . $e->getMessage()], 500);
        }
    }

    public function toggleAvailability(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'DOCTOR') {
            return response()->json(['message' => 'Only doctors can toggle availability'], 400);
        }

        // Check if doctor has active session
        $hasActiveSession = DoctorSession::where('doctor_id', $user->id)
            ->whereNull('end_time')
            ->exists();

        if ($hasActiveSession && !$user->available) {
            return response()->json(['message' => 'Cannot become available with active session'], 400);
        }

        $user->available = !$user->available;
        $user->save();

        return response()->json(['available' => $user->available]);
    }
}
