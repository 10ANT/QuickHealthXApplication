<?php

namespace App\Http\Controllers;

use App\Models\Triage;
use App\Models\QueueEntry;
use App\Events\QueueUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TriageController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'heart_rate' => 'required|integer|min:0|max:250',
            'blood_pressure' => 'required|string|max:255',
            'pain_level' => 'required|integer|min:1|max:10',
            'symptoms' => 'required|string',
        ]);

        DB::beginTransaction();
        try {
            $triage = Triage::create($validated);

            // Calculate urgency score
            $urgencyScore = $this->calculateUrgencyScore($triage);

            // Create queue entry
            $queueEntry = QueueEntry::create([
                'triage_id' => $triage->id,
                'urgency_score' => $urgencyScore,
                'entry_time' => Carbon::now(),
                'status' => 'WAITING',
            ]);

            DB::commit();

            // Broadcast queue update event
            broadcast(new QueueUpdated())->toOthers();

            return response()->json([
                'triage' => $triage,
                'queue_entry' => $queueEntry,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating triage: ' . $e->getMessage()], 500);
        }
    }

    private function calculateUrgencyScore(Triage $triage)
    {
        $score = 0;

        // Pain level: 1-10, multiply by 2 for more weight
        $score += $triage->pain_level * 2;

        // Heart rate
        if ($triage->heart_rate > 100) {
            $score += 3;
        } elseif ($triage->heart_rate < 50) {
            $score += 3;
        }

        // Blood pressure - extract systolic
        preg_match('/(\d+)\/\d+/', $triage->blood_pressure, $matches);
        $systolic = isset($matches[1]) ? (int)$matches[1] : 120;

        if ($systolic > 140) {
            $score += 3;
        } elseif ($systolic < 90) {
            $score += 4;
        }

        // Check for critical symptoms
        $criticalSymptoms = ['chest pain', 'shortness of breath', 'difficulty breathing',
                            'unconscious', 'severe bleeding', 'stroke', 'seizure'];

        foreach ($criticalSymptoms as $symptom) {
            if (stripos($triage->symptoms, $symptom) !== false) {
                $score += 10;
                break;
            }
        }

        return $score;
    }
}
