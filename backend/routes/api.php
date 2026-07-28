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
use App\Http\Controllers\Api\HabitController; 
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
| PUBLIC ROUTES (Unsecured Ping)
|--------------------------------------------------------------------------
*/
Route::get('/ping', function () {
    return response()->json(['status' => 'ok', 'message' => 'System Online']);
});

/*
|--------------------------------------------------------------------------
| 🛠️ SYSTEM RESET (Temporary Bypass for Render Cache)
|--------------------------------------------------------------------------
*/
Route::get('/system/purge-cache', function () {
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    return response()->json([
        'status' => 'success', 
        'message' => 'Matrix Cache Cleared. Laravel will now read the live Environment Variables.'
    ]);
});

/*
|--------------------------------------------------------------------------
| 🛡️ THE PERIMETER: RATE-LIMITED PUBLIC ROUTES
| Prevents brute-force attacks and OTP spam (Max 5 requests per minute)
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/admin/login', [AdminController::class, 'login']);
    
    // Contact & OTP endpoints are heavy targets for automated bots
    Route::post('/contact', [ContactController::class, 'store']); 
    Route::post('/verify-email-otp', [AuthController::class, 'verifyEmailOtp']);
    Route::post('/password/send-otp', [PasswordResetController::class, 'sendOtp']);
    Route::post('/password/verify-otp', [PasswordResetController::class, 'verifyOtp']);
    Route::post('/password/reset', [PasswordResetController::class, 'resetPassword']);
    
    // Google Auth Init
    Route::get('/auth/google/url', [AuthController::class, 'redirectToGoogle']);
});

// Google Callback (Excluded from strict throttle to prevent redirect drops)
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (Requires valid Sanctum Token)
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
    // 🚨 FIXED: Inlined the /me route to guarantee it never fails due to a missing controller method
    Route::get('/me', function (Request $request) { 
        return response()->json($request->user()); 
    });
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

    /* 🧠 OMNI-PROCESS (Heavily throttled to prevent resource exhaustion) */
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/omni-process', [OmniController::class, 'process']);
        Route::post('/omni-process-audio', [OmniController::class, 'processAudio']);
    });

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

    /* 🛡️ AI PREDICTIONS (Protected from spam & dynamic routing applied) */
    Route::middleware('throttle:15,1')->post('/ai-suggestions', function (Request $request) {
        $activities = $request->input('activities');

        if (!$activities || count($activities) === 0) {
            return response()->json(["Awaiting operator telemetry to calibrate the predictive model."]);
        }

        try {
            // Dynamically pull the AI server address from the .env file.
            $aiServiceUrl = 'https://hyperlife-ai.onrender.com/sentient-analysis'; // 🚨 Replace with your real AI URL
            
            $response = Http::timeout(15)->post($aiServiceUrl, [
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

// 🚀 EMAIL VERIFICATION 
use Illuminate\Foundation\Auth\EmailVerificationRequest;
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    
    // 🚨 FIXED: Hard-coded safe fallback to your Vercel frontend
    $frontendUrl = rtrim(env('FRONTEND_URL', 'https://hyperlife-lemon.vercel.app'), '/');
    return redirect("{$frontendUrl}/login?verified=1");
    
})->middleware(['auth:sanctum', 'signed'])->name('verification.verify');