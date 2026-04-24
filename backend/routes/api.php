<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http; 

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UniverseController;
use App\Http\Controllers\Api\PlanetController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\PlanetProgressController;
use App\Http\Controllers\Api\GamificationController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\API\HabitController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\Api\AdminAuthController; 
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\OmniController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ForgeController; 
use App\Http\Controllers\Api\ArsenalController;
use App\Http\Controllers\Api\NeuralGridController;
use App\Http\Controllers\Api\ColosseumController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\PasswordResetController;

use App\Models\User;   
use App\Models\Contact;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/
Route::get('/ping', function () {
    return response()->json(['status' => 'ok', 'message' => 'API Is Working']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/contact', [ContactController::class, 'store']); 
Route::post('/admin/login', [AdminController::class, 'login']);

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (Login Token Required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    
    // 🚀 PAYMENT ROUTES
    Route::post('/create-razorpay-order', [\App\Http\Controllers\Api\PaymentController::class, 'createOrder']);
    Route::post('/verify-razorpay-payment', [\App\Http\Controllers\Api\PaymentController::class, 'verifyPayment']);

    /* 🧠 THE CAPTAIN'S LOG */
    Route::get('/journal', [JournalController::class, 'index']);
    Route::post('/journal', [JournalController::class, 'store']);
    Route::delete('/journal/{id}', [JournalController::class, 'destroy']);
    
    /* ⚔️ THE COLOSSEUM */
    Route::get('/colosseum/operators', [ColosseumController::class, 'operators']);
    Route::get('/colosseum/duels', [ColosseumController::class, 'index']);
    Route::post('/colosseum/challenge', [ColosseumController::class, 'challenge']);
    Route::post('/colosseum/{id}/accept', [ColosseumController::class, 'accept']);
    Route::post('/colosseum/{id}/strike', [ColosseumController::class, 'strike']);
    
    /* 🧠 THE NEURAL GRID */
    Route::get('/skills', [NeuralGridController::class, 'index']);
    Route::post('/skills', [NeuralGridController::class, 'store']);
    Route::post('/skills/{id}/inject', [NeuralGridController::class, 'injectXp']);
    Route::delete('/skills/{id}', [NeuralGridController::class, 'destroy']);

    /* 🛒 THE ARSENAL */
    Route::get('/rewards', [ArsenalController::class, 'index']);
    Route::post('/rewards', [ArsenalController::class, 'store']);
    Route::delete('/rewards/{id}', [ArsenalController::class, 'destroy']);
    Route::post('/rewards/{id}/purchase', [ArsenalController::class, 'purchase']);

    /* ✅ USER PROFILE & AUTHENTICATION */
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', function (Request $request) { return $request->user(); }); 
    Route::post('/logout', [AuthController::class, 'logout']);

   // 🚀 THE AVATAR ROUTE (Must be POST)
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    
    /* 🌌 CORE PLANETS */
    Route::get('/planets', [PlanetController::class, 'index']);
    Route::post('/planets', [PlanetController::class, 'store']);
    Route::delete('/planets/{id}', [PlanetController::class, 'destroy']);

    /* 🚀 CUSTOM FORGE NODES */
    Route::post('/forge/synthesize', [ForgeController::class, 'igniteNode']);
    Route::get('/forge/nodes', [ForgeController::class, 'getNodes']);
    Route::delete('/forge/nodes/{id}', [ForgeController::class, 'destroyNode']);
    
    // 🧬 NODE INJECTION
    Route::post('/forge/inject-mass', [ForgeController::class, 'injectMass']);

    /* ⚔️ THE SYNDICATE GRID */
    Route::get('/syndicate', function () {
        $topUsers = \App\Models\User::orderBy('xp', 'desc')
            ->take(10)
            ->get()
            ->map(function ($user) {
                $topPlanet = \Illuminate\Support\Facades\DB::table('planets')
                    ->join('universes', 'planets.universe_id', '=', 'universes.id')
                    ->where('universes.user_id', $user->id)
                    ->orderBy('planets.size', 'desc')
                    ->select('planets.name', 'planets.type', 'planets.size')
                    ->first();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'level' => $user->level ?? 1,
                    'xp' => $user->xp ?? 0,
                    'top_planet' => $topPlanet
                ];
            });

        return response()->json($topUsers);
    });

    /* 🧠 OMNI-PROCESS */
    Route::post('/omni-process', [OmniController::class, 'process']);
    Route::post('/omni-process-audio', [OmniController::class, 'processAudio']); // 🚀 NEW AUDIO ROUTE ADDED HERE

    /* ✅ SYSTEM PROTOCOLS */
    Route::get('/system/status', [AdminController::class, 'getSystemStatus']);
    Route::get('/system/directive', function () {
        return response()->json(['directive' => \Illuminate\Support\Facades\Cache::get('system_directive')]);
    });

    /* 👑 ADMIN COMMAND CENTER ROUTES */
    Route::prefix('admin')->group(function () {
        Route::get('/overview', [AdminController::class, 'getOverview']);
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::get('/omniverse', [AdminController::class, 'getOmniverse']);
        Route::get('/feed', [AdminController::class, 'getLiveFeed']);
        
        Route::post('/directive', [AdminController::class, 'setDirective']);
        Route::post('/blackout', [AdminController::class, 'toggleBlackout']);
        
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::get('/users/{id}/activities', [AdminController::class, 'getUserActivities']); 
    });

    /* ✅ UNIVERSES & PLANETS */
    Route::get('/universes', [UniverseController::class, 'index']);
    Route::post('/universes', [UniverseController::class, 'store']);
    Route::get('/universes/{id}/summary', [UniverseController::class, 'summary']);

    Route::get('/universes/{universe}/planets', [PlanetController::class, 'byUniverse']); 
    Route::get('/planets/{planet}/progress', [PlanetProgressController::class, 'index']);
    Route::post('/planets/{planet}/progress', [PlanetProgressController::class, 'store']);
    Route::put('/planets/{planet}/progress/{progress}', [PlanetProgressController::class, 'update']);
    Route::delete('/planets/{planet}/progress/{progress}', [PlanetProgressController::class, 'destroy']);

    /* ✅ GAMIFICATION & HABITS */
    Route::get('/gamification', [GamificationController::class, 'index']);
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::get('/activities/{id}', [ActivityController::class, 'show']);
    Route::put('/activities/{id}', [ActivityController::class, 'update']);
    Route::delete('/activities/{id}', [ActivityController::class, 'destroy']);
    Route::get('/activity-stats', [ActivityController::class, 'stats']);
    Route::get('/leaderboard', [GamificationController::class, 'leaderboard']);

    Route::get('/habits', [HabitController::class, 'index']);
    Route::post('/habits', [HabitController::class, 'store']);
    Route::post('/habits/{id}/complete', [HabitController::class, 'complete']);
    Route::delete('/habits/{id}', [HabitController::class, 'destroy']); 

    Route::get('/analytics/weekly', [AnalyticsController::class, 'weekly']);

    /* 🚀 AI PREDICTIONS */
    Route::post('/ai-suggestions', function (Request $request) {
        $activities = $request->input('activities');

        if (!$activities || count($activities) === 0) {
            return response()->json(["Awaiting operator telemetry to calibrate the predictive model."]);
        }

        try {
            $response = Http::timeout(15)->post('http://127.0.0.1:5000/sentient-analysis', [
                'activities' => $activities
            ]);

            if ($response->successful()) {
                return response()->json([$response->json()['insight']]);
            }
        } catch (\Exception $e) {
            $moodSum = 0; $energySum = 0; $count = count($activities);
            foreach ($activities as $a) { $moodSum += $a['mood_level']; $energySum += $a['energy_level']; }
            $avgEnergy = $energySum / $count;
            
            if ($avgEnergy < 5) return response()->json(["Offline Mode: Energy low. Suggesting rest protocol."]);
            return response()->json(["Offline Mode: System stable. Python neural link disconnected."]);
        }
    });
});

// 🚀 GOOGLE AUTH ROUTES
Route::get('/auth/google/url', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

// 🚀 EMAIL VERIFICATION 
use Illuminate\Foundation\Auth\EmailVerificationRequest;
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    return redirect('http://localhost:5173/login?verified=1');
})->middleware(['auth:sanctum', 'signed'])->name('verification.verify');

Route::post('/verify-email-otp', [\App\Http\Controllers\Api\AuthController::class, 'verifyEmailOtp']);

// Reset password routes
Route::post('/password/send-otp', [PasswordResetController::class, 'sendOtp']);
Route::post('/password/verify-otp', [PasswordResetController::class, 'verifyOtp']);
Route::post('/password/reset', [PasswordResetController::class, 'resetPassword']);