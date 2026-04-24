<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Traits\OmniEngine;

class ActivityController extends Controller
{
    use OmniEngine;

    public function index(Request $request)
    {
        $user = $request->user();
        $daysLimit = $user->getAnalyticsDaysLimit();

        // 🚀 SUBSCRIPTION GATEKEEPER: Filter history based on tier (7 days vs 30 days vs Unlimited)
        $query = Activity::where('user_id', $user->id)->orderBy('activity_date', 'desc');
        
        if ($daysLimit < 9999) {
            $query->where('activity_date', '>=', now()->subDays($daysLimit));
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'activity_date' => 'required|date',
            ]);

            $mood_level = 5;
            $energy_level = 5;
            $telemetryText = "Action: " . $request->title . ". Details: " . ($request->description ?? 'None');

            // 🚀 SUBSCRIPTION GATEKEEPER: Only Commander+ gets premium AI parsing
            if ($request->user()->canUseAIInsights()) {
                try {
                    $aiRes = Http::timeout(10)->acceptJson()->post('http://127.0.0.1:5000/psych-eval', [
                        'log_text' => $telemetryText
                    ]);
                    if ($aiRes->successful()) {
                        $mood_level = $aiRes->json()['sentiment_score'] ?? 5;
                    }
                } catch (\Exception $e) {
                    Log::warning("AI Auto-Calibration Offline: " . $e->getMessage());
                }
            }

            // ⚡ Local Fast Heuristic (For Free/Navigator users, and as a fallback for AI)
            $textLower = strtolower($telemetryText);
            if (preg_match('/\b(exhausted|tired|drained|dead|sleepy|fatigue)\b/', $textLower)) {
                $energy_level = rand(1, 3);
                if (!$request->user()->canUseAIInsights()) $mood_level = rand(3, 4);
            } elseif (preg_match('/\b(gym|workout|run|lift|sprint|pumped|energetic|high energy)\b/', $textLower)) {
                $energy_level = rand(8, 10);
                if (!$request->user()->canUseAIInsights()) $mood_level = rand(7, 9);
            } else {
                $energy_level = min(10, max(1, $mood_level + rand(-1, 1)));
            }

            $activity = Activity::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'activity_date' => $validated['activity_date'],
                'mood_level' => $mood_level,
                'energy_level' => $energy_level,
            ]);

            $analysis = $this->analyzeTelemetry($activity->title);
            $xpEarned = $analysis['xp_delta'];

            $userId = $request->user()->id;
            $userRecord = DB::table('users')->where('id', $userId)->first();
            
            $newXp = (int)($userRecord->xp ?? 0) + $xpEarned;
            $newLevel = (int)($userRecord->level ?? 1);
            $leveledUp = false;

            while ($newXp >= 100) {
                $newLevel += 1; $newXp -= 100; $leveledUp = true;
            }
            while ($newXp < 0 && $newLevel > 1) {
                $newLevel -= 1; $newXp += 100;
            }
            if ($newXp < 0 && $newLevel === 1) $newXp = 0;

            DB::table('users')->where('id', $userId)->update(['xp' => $newXp, 'level' => $newLevel]);

            return response()->json([
                'message' => 'Activity logged successfully.',
                'activity' => $activity,
                'gamification' => [
                    'xp_awarded' => $xpEarned, 'total_xp' => $newXp, 'current_level' => $newLevel, 'leveled_up' => $leveledUp, 'level_status' => $leveledUp ? 1 : 0
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $activity = Activity::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
            
            $analysis = $this->analyzeTelemetry($activity->title);
            $xpToReverse = $analysis['xp_delta']; 
            $activity->delete();

            $userId = $request->user()->id;
            $userRecord = DB::table('users')->where('id', $userId)->first();
            
            $newXp = (int)($userRecord->xp ?? 0) - $xpToReverse; 
            $newLevel = (int)($userRecord->level ?? 1);
            $levelStatus = 0;

            while ($newXp >= 100) { $newLevel += 1; $newXp -= 100; $levelStatus = 1; }
            while ($newXp < 0 && $newLevel > 1) { $newLevel -= 1; $newXp += 100; $levelStatus = -1; }
            if ($newXp < 0 && $newLevel === 1) $newXp = 0;

            DB::table('users')->where('id', $userId)->update(['xp' => $newXp, 'level' => $newLevel]);

            return response()->json([
                'message' => 'Activity deleted successfully.',
                'gamification' => ['xp_reversed' => -$xpToReverse, 'total_xp' => $newXp, 'current_level' => $newLevel, 'level_status' => $levelStatus]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function stats(Request $request)
    {
        $user = $request->user();
        $daysLimit = $user->getAnalyticsDaysLimit();

        // 🚀 SUBSCRIPTION GATEKEEPER: Scope averages to their allowed history window
        $query = Activity::where('user_id', $user->id);
        if ($daysLimit < 9999) {
            $query->where('activity_date', '>=', now()->subDays($daysLimit));
        }
        
        $activities = $query->get();

        return response()->json([
            'total' => $activities->count(),
            'total_activities' => $activities->count(),
            'avg_mood' => $activities->count() ? round($activities->avg('mood_level'), 1) : 0,
            'avg_energy' => $activities->count() ? round($activities->avg('energy_level'), 1) : 0,
            'user_xp' => $user->xp ?? 0,
            'user_level' => $user->level ?? 1,
            'days_analyzed' => $daysLimit === 9999 ? 'Unlimited' : $daysLimit // Pass this to UI so it knows what to display!
        ]);
    }
}