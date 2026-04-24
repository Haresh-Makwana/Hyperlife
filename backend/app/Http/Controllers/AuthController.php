<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ==========================================
    // 🚀 INITIALIZE PROFILE (REGISTER)
    // ==========================================
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'role' => 'required|in:user,admin',
            // Optional secret key for creating an admin during your MCA project presentation
            'admin_secret' => 'nullable|string' 
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $assignedRole = $request->role;

        // 🛑 SECURITY CHECK: Allow admin creation ONLY if they know the secret key
        if ($assignedRole === 'admin') {
            // Change 'hyperlife2026' to whatever secret code you want to use
            if ($request->admin_secret !== 'hyperlife2026') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin clearance cannot be self-assigned without the secure key.'
                ], 403);
            }
        }

        // Map the role to match your database structure. 
        // If your DB uses integers (1 for admin, 0 for user), change this to:
        // $dbRole = ($assignedRole === 'admin') ? 1 : 0;
        $dbRole = $assignedRole; 

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $dbRole, 
        ]);

        return response()->json([
            'message' => ucfirst($assignedRole) . ' registered successfully in HyperLife OS',
            'user' => $user
        ], 201);
    }

    // ==========================================
    // 🔐 ACCESS CONSOLE (LOGIN)
    // ==========================================
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'role' => 'required|in:user,admin' 
        ]);

        $user = User::where('email', $request->email)->first();

        // 1. Verify credentials
        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials provided.'],
            ]);
        }

        // 2. Normalize the database role to a string to prevent Type Mismatch Errors
        // This ensures that whether your DB stores '1', 1, or 'admin', it correctly validates
        $normalizedDbRole = ($user->role === 1 || $user->role === '1' || $user->role === 'admin') ? 'admin' : 'user';

        // 3. 🛑 STRICT ROLE CHECK
        if ($normalizedDbRole !== $request->role) {
            return response()->json([
                'status' => 'error',
                'message' => 'Admin Panel Security Breach Error: Access Denied. You do not have ' . strtoupper($request->role) . ' clearance.'
            ], 403);
        }

        // 4. Generate Sanctum token
        // Make sure your User model uses the HasApiTokens trait!
        $token = $user->createToken('hyperlife_auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'role' => $normalizedDbRole, 
            'user' => $user
        ]);
    }

    // ==========================================
    // 👤 GET CURRENT USER
    // ==========================================
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // ==========================================
    // 🚪 DISCONNECT (LOGOUT)
    // ==========================================
    public function logout(Request $request)
    {
        // Revoke the token that was used to authenticate the current request
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Successfully disconnected from HyperLife OS'
        ]);
    }
}