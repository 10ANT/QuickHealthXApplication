<?php


use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\TriageController;
use App\Http\Controllers\QueueController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Patient routes
    Route::apiResource('patients', PatientController::class);
    Route::get('/patients/search', [PatientController::class, 'search']);

    // Triage routes
    Route::post('/triage', [TriageController::class, 'store']);

    // Queue routes
    Route::get('/queue', [QueueController::class, 'index']);

    // Doctor routes
                Route::middleware('can:doctor')->group(function () {
                    Route::post('/doctor/toggle-availability', [QueueController::class, 'toggleAvailability']);
                    Route::post('/doctor/assign-patient', [QueueController::class, 'assignPatient']);
                    Route::get('/doctor/current-session', [QueueController::class, 'getCurrentSession']);
                    Route::post('/doctor/complete-session', [QueueController::class, 'completeSession']);
                });
});


Route::get('/', function () {
    return view('welcome');
});
