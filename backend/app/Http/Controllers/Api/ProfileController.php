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
            // 🚀 SAFETY NET: Explicitly grab the authenticated user
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Authentication failed. Please log in again.'
                ], 401);
            }

            // 🚀 FIXED: Simplified validation. 'image' handles Blob uploads much better than 'mimes'
            $request->validate([
                'avatar' => 'required|image|max:10240', 
            ]);

            if ($request->hasFile('avatar')) {
                // Delete the old avatar from storage to keep the server clean
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }

                // Save the new file to the 'avatars' folder
                $file = $request->file('avatar');
                $path = $file->store('avatars', 'public');
                
                // Save the path to the database
                $user->avatar = $path;
                $user->save();

                // 🚀 FIXED: Dynamic URL generation to prevent localhost mismatch errors
                $fullUrl = url('storage/' . $path);

                return response()->json([
                    'message' => 'Avatar updated successfully',
                    'avatar_path' => $path,
                    'avatar_url' => $fullUrl
                ], 200);
            }

            return response()->json(['message' => 'No image file detected in the payload.'], 400);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Catches strict validation errors and tells React exactly what failed
            return response()->json([
                'message' => 'Invalid image format or size.',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            // Catches folder permission or storage link errors
            Log::error('Avatar Upload Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server Error: Could not save the image.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}