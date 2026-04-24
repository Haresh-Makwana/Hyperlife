<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Universe; 
use App\Models\Planet;   
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Auth\Events\Registered;

class AuthController extends Controller
{
    // ==========================================
    // 1. STANDARD REGISTRATION & VERIFICATION
    // ==========================================
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'role' => 'required|string|in:user,operator,admin',
            'admin_code' => 'nullable|string' 
        ]);

        // --- ANTI-SPAM SHIELD ---
        $emailParts = explode('@', strtolower($request->email));
        $localPart = $emailParts[0]; $domain = $emailParts[1];
        $blacklistedDomains = ['mailinator.com', '10minutemail.com', 'tempmail.com', 'yopmail.com', 'temp-mail.org'];
        if (in_array($domain, $blacklistedDomains) || !checkdnsrr($domain, 'MX')) {
            return response()->json(['message' => 'ACCESS DENIED: Invalid or temporary email.'], 422);
        }
        $blacklistedPrefixes = ['test', 'abc', 'dummy', 'fake', 'admin', 'root', 'user'];
        foreach ($blacklistedPrefixes as $prefix) {
            if (str_starts_with($localPart, $prefix)) return response()->json(['message' => "ACCESS DENIED: Prefix restricted."], 422);
        }
        // --- END SHIELD ---

        // 🚀 SECURE CLEARANCE CHECK
        if ($request->role === 'admin' && $request->admin_code !== env('ADMIN_SECRET_KEY', 'HYPER_ADMIN_777')) {
            return response()->json(['message' => 'ACCESS DENIED: Invalid System Override Key.'], 403);
        }

        $roleToAssign = $request->role === 'admin' ? 'admin' : 'operator';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'role' => $roleToAssign, 
        ]);
        $this->initializeUniverse($user);

        // 🚀 THE OTP PROTOCOL
        $otp = rand(100000, 999999);
        \Illuminate\Support\Facades\DB::table('email_verifications')->where('email', $user->email)->delete();
        \Illuminate\Support\Facades\DB::table('email_verifications')->insert([
            'email' => $user->email,
            'otp' => \Illuminate\Support\Facades\Hash::make($otp),
            'created_at' => \Carbon\Carbon::now()
        ]);

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.gmail.com',
            'mail.mailers.smtp.port' => 587,
            'mail.mailers.smtp.encryption' => 'tls',
            'mail.mailers.smtp.username' => 'hareshratilal2003@gmail.com', 
            'mail.mailers.smtp.password' => 'pceisowlspixtqgw', 
            'mail.from.address' => 'hareshratilal2003@gmail.com',
            'mail.from.name' => 'HyperLife Sentient Core',
        ]);

        \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\VerifyAccountOtp($otp));

        return response()->json([
            'status' => 'pending_verification',
            'message' => 'Decryption Key transmitted. Please verify your inbox.'
        ], 201);
    }

    public function verifyEmailOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|numeric|digits:6'
        ]);

        $record = \Illuminate\Support\Facades\DB::table('email_verifications')->where('email', $request->email)->first();

        if (!$record || !\Illuminate\Support\Facades\Hash::check($request->otp, $record->otp)) {
            return response()->json(['message' => 'Invalid or expired Decryption Key.'], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->email_verified_at = \Carbon\Carbon::now();
        $user->save();

        \Illuminate\Support\Facades\DB::table('email_verifications')->where('email', $request->email)->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Identity verified. Welcome to the Matrix.',
            'token' => $token,
            'user' => $user
        ]);
    }

    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required']);

        $user = User::where('email', $request->email)->first();

        if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'ACCESS DENIED: Your email address is not verified. Please check your inbox or request a new transmission.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'ok',
            'user' => $user,
            'token' => $token
        ]);
    }

    // ==========================================
    // 2. GOOGLE SINGLE SIGN-ON (SSO) 
    // ==========================================
    public function redirectToGoogle()
    {
        $guzzleClient = new \GuzzleHttp\Client(['verify' => false]);

        return response()->json([
            'url' => Socialite::driver('google')
                        ->setHttpClient($guzzleClient)
                        ->stateless()
                        ->redirect()
                        ->getTargetUrl()
        ]);
    }

    public function handleGoogleCallback()
    {
        try {
            $guzzleClient = new \GuzzleHttp\Client(['verify' => false]);

            $googleUser = Socialite::driver('google')
                            ->setHttpClient($guzzleClient)
                            ->stateless()
                            ->user();
            
            $user = User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'password' => null, 
                    'role' => 'operator',
                    'email_verified_at' => now(), 
                ]);
                $this->initializeUniverse($user);
            } else {
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->getId()]);
                }
            }

            $token = $user->createToken('auth_token')->plainTextToken;
            
            // 🚀 FIXED: URL Encode the token so the pipe "|" character doesn't break browser routing
            $safeToken = urlencode($token);
            $safeRole = urlencode($user->role);
            return redirect("http://localhost:5173/login?token={$safeToken}&role={$safeRole}");

        } catch (\Exception $e) {
            $errorMsg = urlencode($e->getMessage());
            return redirect("http://localhost:5173/login?error={$errorMsg}");
        }
    }


    // ==========================================
    // 3. UTILITIES
    // ==========================================
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            
            // 🚀 FIXED: Safe returns prevent 500 Server Crashes if DB columns are empty
            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'operator',
                'xp' => $user->xp ?? 0,
                'level' => $user->level ?? 1,
                'avatar' => $user->avatar ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to parse user core data.', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function initializeUniverse($user) 
    {
        $universe = Universe::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Constellation",
        ]);

        $startingPlanets = [
            ['universe_id' => $universe->id, 'key' => 'health', 'name' => 'Vitality Sphere', 'type' => 'Health', 'size' => 1.0, 'position_x' => 0, 'position_y' => 0, 'position_z' => 0],
            ['universe_id' => $universe->id, 'key' => 'knowledge', 'name' => 'Neural Core', 'type' => 'Knowledge', 'size' => 0.8, 'position_x' => 4, 'position_y' => 0, 'position_z' => 4],
            ['universe_id' => $universe->id, 'key' => 'finance', 'name' => 'Asset Node', 'type' => 'Finance', 'size' => 1.1, 'position_x' => -6, 'position_y' => 0, 'position_z' => -2]
        ];

        foreach ($startingPlanets as $planetData) {
            Planet::create($planetData);
        }
    }
}