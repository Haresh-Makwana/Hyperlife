<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Upload or replace the authenticated user's profile avatar.
     */
    public function uploadAvatar(Request $request)
    {
        try {
            /*
             * ---------------------------------------------------------
             * 1. Authentication
             * ---------------------------------------------------------
             */
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in again.',
                ], 401);
            }

            /*
             * ---------------------------------------------------------
             * 2. Validate uploaded image
             * ---------------------------------------------------------
             *
             * max:10240 = 10 MB
             *
             * mimes restricts the accepted formats.
             * image confirms that the uploaded file is an image.
             */
            $validated = $request->validate([
                'avatar' => [
                    'required',
                    'file',
                    'image',
                    'mimes:jpg,jpeg,png,webp,gif',
                    'max:10240',
                ],
            ]);

            /*
             * ---------------------------------------------------------
             * 3. Make sure the file actually exists
             * ---------------------------------------------------------
             */
            if (!$request->hasFile('avatar')) {
                return response()->json([
                    'message' => 'No avatar file was received.',
                ], 422);
            }

            $file = $request->file('avatar');

            if (!$file->isValid()) {
                return response()->json([
                    'message' => 'The uploaded image is invalid or corrupted.',
                ], 422);
            }

            /*
             * ---------------------------------------------------------
             * 4. Store NEW avatar first
             * ---------------------------------------------------------
             *
             * Important:
             * We save the new file BEFORE deleting the old one.
             * This prevents losing the existing avatar if storage fails.
             */
            $newPath = $file->store('avatars', 'public');

            if (!$newPath) {
                return response()->json([
                    'message' => 'Failed to store the uploaded image.',
                ], 500);
            }

            /*
             * ---------------------------------------------------------
             * 5. Save the old avatar path
             * ---------------------------------------------------------
             */
            $oldPath = $user->avatar;

            /*
             * ---------------------------------------------------------
             * 6. Update database
             * ---------------------------------------------------------
             */
            $user->avatar = $newPath;
            $user->save();

            /*
             * ---------------------------------------------------------
             * 7. Delete old avatar AFTER successful database update
             * ---------------------------------------------------------
             */
            if (
                !empty($oldPath) &&
                $oldPath !== $newPath &&
                Storage::disk('public')->exists($oldPath)
            ) {
                Storage::disk('public')->delete($oldPath);
            }

            /*
             * ---------------------------------------------------------
             * 8. Build public URL
             * ---------------------------------------------------------
             */
            $avatarUrl = Storage::disk('public')->url($newPath);

            /*
             * ---------------------------------------------------------
             * 9. Response
             * ---------------------------------------------------------
             */
            return response()->json([
                'message' => 'Profile picture uploaded successfully.',
                'avatar_path' => $newPath,
                'avatar_url' => $avatarUrl,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                ],
            ], 200);

        } catch (ValidationException $e) {
            Log::warning('Avatar validation failed.', [
                'user_id' => optional($request->user())->id,
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'message' => 'Please select a valid image. JPG, JPEG, PNG, WEBP or GIF up to 10 MB is allowed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            Log::error('Avatar upload failed.', [
                'user_id' => optional($request->user())->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Unable to upload profile picture right now.',
            ], 500);
        }
    }
}