<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JournalController extends Controller
{
    public function index() {
        $logs = JournalLog::where('user_id', auth()->id())
            ->orderBy('created_at', 'asc') 
            ->get();
        return response()->json($logs);
    }

    public function store(Request $request) {
        $request->validate(['log_text' => 'required|string|max:2000']);

        $evalText = "Awaiting AI Analysis...";
        $sentiment = 5;

        try {
            // 🚨 SECURE CONNECTION: Matches your exact .env variables (AI_CORE_URL fallback)
            $aiUrl = rtrim(env('AI_MICROSERVICE_URL', env('AI_CORE_URL', 'https://hyperlife-ai-core-nwkg.onrender.com')), '/');
            $aiSecret = env('HYPER_AI_SECRET_KEY', ''); // Grabs the key to pass the Python shield
            
            // Inject the Bearer token into the HTTP request
            $aiRes = Http::withToken($aiSecret)
                ->timeout(30)
                ->acceptJson()
                ->post($aiUrl . '/psych-eval', [
                    'log_text' => $request->log_text
                ]);

            if ($aiRes->successful()) {
                $data = $aiRes->json();
                $evalText = $data['evaluation'] ?? $data['ai_evaluation'] ?? 'Analysis complete. No anomalies detected.';
                $sentiment = $data['sentiment_score'] ?? 5;
            } else {
                $evalText = "AI Core Error (" . $aiRes->status() . "): " . $aiRes->body();
            }
        } catch (\Exception $e) {
            $errorMsg = $e->getMessage();
            $evalText = "Offline Mode: Cloud Bypass Failed -> " . $errorMsg;
            Log::error("Psych-Eval Connection Error: " . $errorMsg);
        }

        $log = JournalLog::create([
            'user_id' => auth()->id(),
            'log_text' => $request->log_text,
            'ai_evaluation' => $evalText,
            'sentiment_score' => $sentiment
        ]);

        return response()->json(['message' => 'Log processed.', 'log' => $log]);
    }

    public function destroy($id) {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        JournalLog::where('id', $id)
            ->where('user_id', auth()->id())
            ->delete();

        return response()->json(['message' => 'Log eradicated.']);
    }
}