<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contact; // Imports your Contact model
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        try {
            // 1. Validate the incoming transmission
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'message' => 'required|string',
            ]);

            // 2. Save securely to the database
            $contact = Contact::create($validatedData);

            // 3. Return a success response to your React frontend
            return response()->json([
                'status' => 'success',
                'message' => 'Secure transmission received successfully.',
                'data' => $contact
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Returns validation errors (e.g., missing email)
            return response()->json([
                'status' => 'error',
                'message' => 'Transmission validation failed.',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            // Catches database crashes or other unexpected errors
            Log::error('Contact Form Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Server anomaly detected. Transmission failed.'
            ], 500);
        }
    }
}