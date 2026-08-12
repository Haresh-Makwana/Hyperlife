<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    public function uploadAvatar(Request $request)
    {
        try {
            // 🚀 DIAGNOSTICS: See exactly what the frontend is sending
            Log::info('Avatar Upload Attempt', [
                'has_file' => $request->hasFile('avatar'),
                'method' => $request->method(),
                'payload_keys' => array_keys($request->all())
            ]);

            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Authentication failed. Please log in again.'
                ], 401);
            }

            $request->validate([
                'avatar' => 'required|image|max:10240', 
            ]);

            if ($request->hasFile('avatar')) {
                // 🚀 THE FIX: Check if file actually exists before trying to delete it
                if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                    Storage::disk('public')->delete($user->avatar);
                }

                $file = $request->file('avatar');
                $path = $file->store('avatars', 'public');
                
                $user->avatar = $path;
                $user->save();

                $fullUrl = url('storage/' . $path);

                return response()->json([
                    'message' => 'Avatar updated successfully',
                    'avatar_path' => $path,
                    'avatar_url' => $fullUrl
                ], 200);
            }

            return response()->json(['message' => 'No image file detected in the payload.'], 400);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Avatar Validation Failed', ['errors' => $e->errors()]);
            return response()->json([
                'message' => 'Invalid image format or size.',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Avatar Upload Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server Error: Could not save the image.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}