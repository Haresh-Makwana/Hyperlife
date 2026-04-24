<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // 🛑 DEBUG CHECK 1: Does the email exist?
        if (! $user) {
            return response()->json([
                'status' => 'error',
                'message' => "Uplink failed: No admin found with email '{$request->email}'."
            ], 401);
        }

        // 🛑 DEBUG CHECK 2: Does the password match the hash?
        if (! Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => "Uplink failed: Incorrect passcode."
            ], 401);
        }

        // 🛑 STRICT ROLE CHECK
        $role = strtolower(trim((string)$user->role));
        if ($role !== 'admin' && $role !== '1') {
            return response()->json([
                'status' => 'error',
                'message' => 'SECURITY BREACH: Account lacks System Administrator clearance.'
            ], 403);
        }

        // 🚀 GENERATE TOKEN & LOGIN
        $token = $user->createToken('hyperlife_admin_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'role' => 'admin',
            'user' => $user
        ]);
    }
}