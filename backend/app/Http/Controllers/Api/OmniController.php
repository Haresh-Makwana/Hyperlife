<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Activity;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Facades\Http; 

class OmniController extends Controller
{
    // -------------------------------------------------------------
    // 🚀 EXISTING METHOD: Standard Text Processing
    // -------------------------------------------------------------
    public function process(Request $request)
    {
        $request->validate(['telemetry_text' => 'required|string|max:500']);

        $userId = auth()->id();
        if (!$userId) {
            return response()->json(['message' => 'System Error: Operator unauthenticated.'], 401);
        }

        $rawText = $request->telemetry_text;

        try {
            // 🚀 FIXED: Cleaned up the Markdown link formatting
            $aiResponse = Http::timeout(15)->post('http://127.0.0.1:5000/omni-process', [
                'telemetry_text' => $rawText
            ]);

            if ($aiResponse->successful()) {
                $aiData = $aiResponse->json();
                $insightMessage = $aiData['analysis'] ?? 'Telemetry recorded successfully.';
                $xpDelta = $aiData['gamification']['xp_gained'] ?? 15;
            } else {
                throw new \Exception("AI Core returned error status.");
            }
        } catch (\Exception $e) {
            $insightMessage = "Offline Mode: Data saved to local matrix.";
            $xpDelta = 10;
        }

        $activity = Activity::create([
            'user_id' => $userId,
            'title' => substr($rawText, 0, 40) . (strlen($rawText) > 40 ? '...' : ''),
            'description' => "Omni-Node Insight: " . $insightMessage,
            'energy_level' => 5, 
            'mood_level' => 5,
            'activity_date' => now()
        ]);

        return $this->applyGamificationAndRespond($userId, $xpDelta, $insightMessage);
    }

    // -------------------------------------------------------------
    // 🎙️ NEW METHOD: Audio File Processing
    // -------------------------------------------------------------
    public function processAudio(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimes:webm,wav,mp3,ogg,m4a|max:10240' // Max 10MB
        ]);

        $userId = auth()->id();
        if (!$userId) {
            return response()->json(['message' => 'System Error: Operator unauthenticated.'], 401);
        }

        $file = $request->file('audio');

        try {
            $audioContent = file_get_contents($file->getRealPath());
            $filename = $file->getClientOriginalName() ?: 'voice_command.webm';

            // 🚀 FIXED: Cleaned up the Markdown link formatting
            $aiResponse = Http::timeout(60)
                ->attach('audio', $audioContent, $filename)
                ->post('http://127.0.0.1:5000/omni-process-audio'); 

            if ($aiResponse->successful()) {
                $aiData = $aiResponse->json();
                $transcribedText = $aiData['transcription'] ?? 'Voice Telemetry Logged';
                $insightMessage = $aiData['analysis'] ?? 'Audio analyzed successfully.';
                $xpDelta = $aiData['gamification']['xp_gained'] ?? 20; 
            } else {
                throw new \Exception("AI Core failed to process audio.");
            }
        } catch (\Exception $e) {
            // ⚠️ FALLBACK
            $transcribedText = "Encrypted Voice Transmission";
            $insightMessage = "Offline Mode: Audio data securely cached in local matrix.";
            $xpDelta = 15;
        }

        $activity = Activity::create([
            'user_id' => $userId,
            'title' => '🎤 ' . substr($transcribedText, 0, 35) . (strlen($transcribedText) > 35 ? '...' : ''),
            'description' => "Omni-Node Insight: " . $insightMessage,
            'energy_level' => 5, 
            'mood_level' => 5,
            'activity_date' => now()
        ]);

        return $this->applyGamificationAndRespond($userId, $xpDelta, $insightMessage);
    }

    // -------------------------------------------------------------
    // ⚙️ HELPER METHOD: Keeps your DB math clean and DRY
    // -------------------------------------------------------------
    private function applyGamificationAndRespond($userId, $xpDelta, $insightMessage)
    {
        $userRecord = DB::table('users')->where('id', $userId)->first();
        
        $newXp = (int)($userRecord->xp ?? 0) + $xpDelta;
        $newLevel = (int)($userRecord->level ?? 1);
        $levelStatus = 0; 

        while ($newXp >= 100) {
            $newLevel += 1;
            $newXp -= 100;
            $levelStatus = 1;
        }

        while ($newXp < 0 && $newLevel > 1) {
            $newLevel -= 1;
            $newXp += 100;
            $levelStatus = -1;
        }

        if ($newXp < 0 && $newLevel === 1) {
            $newXp = 0;
        }

        DB::table('users')->where('id', $userId)->update([
            'xp' => $newXp,
            'level' => $newLevel
        ]);

        return response()->json([
            'message' => 'Telemetry processed.',
            'analysis' => $insightMessage,
            'gamification' => [
                'xp_changed' => $xpDelta,
                'total_xp' => $newXp,
                'current_level' => $newLevel,
                'level_status' => $levelStatus
            ]
        ]);
    }
}