<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\ResetPasswordOtp;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    // 🚀 STEP 1: GENERATE AND SEND OTP
  // 🚀 STEP 1: GENERATE AND SEND OTP
    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        // Delete old OTPs for this email to prevent conflicts
        DB::table('otp_resets')->where('email', $request->email)->delete();

        // Generate 6-digit OTP
        $otp = rand(100000, 999999);

        DB::table('otp_resets')->insert([
            'email' => $request->email,
            'otp' => Hash::make($otp), // Hash it in DB for security
            'created_at' => \Carbon\Carbon::now()
        ]);

        // 🚀 THE ULTIMATE HARDWIRE: Force Laravel to use Gmail and bypass the broken cache
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.gmail.com',
            'mail.mailers.smtp.port' => 587,
            'mail.mailers.smtp.encryption' => 'tls',
            'mail.mailers.smtp.username' => 'hareshratilal2003@gmail.com', 
            'mail.mailers.smtp.password' => 'pceisowlspixtqgw', // <-- NO SPACES
            'mail.from.address' => 'hareshratilal2003@gmail.com',
            'mail.from.name' => 'HyperLife Sentient Core',
        ]);

        // Send the email
        \Illuminate\Support\Facades\Mail::to($request->email)->send(new \App\Mail\ResetPasswordOtp($otp));

        return response()->json(['message' => 'Decryption Key transmitted to your inbox.']);
    }

    // 🚀 STEP 2: VERIFY OTP
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|numeric|digits:6'
        ]);

        $resetRequest = DB::table('otp_resets')->where('email', $request->email)->first();

        if (!$resetRequest) {
            return response()->json(['message' => 'Invalid or expired request.'], 400);
        }

        // Check if expired (older than 10 minutes)
        if (Carbon::parse($resetRequest->created_at)->addMinutes(10)->isPast()) {
            DB::table('otp_resets')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Decryption Key has expired. Request a new one.'], 400);
        }

        if (!Hash::check($request->otp, $resetRequest->otp)) {
            return response()->json(['message' => 'Invalid Decryption Key.'], 400);
        }

        return response()->json(['message' => 'Identity verified. Proceed to password override.']);
    }

    // 🚀 STEP 3: RESET PASSWORD
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|numeric|digits:6',
            'password' => 'required|min:6|confirmed'
        ]);

        $resetRequest = DB::table('otp_resets')->where('email', $request->email)->first();

        if (!$resetRequest || !Hash::check($request->otp, $resetRequest->otp)) {
            return response()->json(['message' => 'Invalid or expired session.'], 400);
        }

        // Update User Password
        User::where('email', $request->email)->update([
            'password' => Hash::make($request->password)
        ]);

        // Destroy the OTP record
        DB::table('otp_resets')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Security override complete. You may now login.']);
    }
}