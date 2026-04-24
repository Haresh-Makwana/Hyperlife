<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JournalLog;
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
            // 🚀 THE FIX: Removed the invalid ->asJson() method that caused the 500 crash.
            // Laravel automatically sends as JSON when passing an array to post().
            $aiRes = Http::timeout(30)
                ->acceptJson()
                ->post('http://127.0.0.1:5000/psych-eval', [
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
            if (str_contains($errorMsg, 'Connection refused')) {
                $evalText = "Offline Mode: Connection Refused. Ensure Python server is running on port 5000.";
            } else {
                $evalText = "Offline Mode: Connection Failed -> " . $errorMsg;
            }
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
        JournalLog::where('id', $id)->where('user_id', auth()->id())->delete();
        return response()->json(['message' => 'Log eradicated.']);
    }
}