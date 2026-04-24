<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Habit;
use App\Models\Planet;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB; 

class HabitController extends Controller
{
    // Get all habits
    public function index()
    {
        return Habit::where('user_id', auth()->id())->with('planet')->get();
    }

    // Create habit
    public function store(Request $request)
    {
        $request->validate([
            'planet_key' => 'required',
            'title' => 'required'
        ]);

        $planet = Planet::where('key', strtolower($request->planet_key))->firstOrFail();

        // 🚀 FIXED: Removed 'xp_reward' so it matches your database perfectly!
        $habit = Habit::create([
            'user_id' => auth()->id(),
            'planet_id' => $planet->id,
            'title' => $request->title,
            'streak' => 0
        ]);

        return $habit->load('planet');
    }

    // Complete habit
    public function complete($id)
    {
        $habit = Habit::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        // Prevent spamming
        if ($habit->last_completed_at && Carbon::parse($habit->last_completed_at)->isToday()) {
            return response()->json(['message' => 'Protocol already synced today! Come back tomorrow.'], 400);
        }

        $habit->streak += 1;
        $habit->last_completed_at = Carbon::now();
        $habit->save();

        // 🚀 GLOBAL XP INCREASE LOGIC (+10 XP)
        $userId = auth()->id();
        $userRecord = DB::table('users')->where('id', $userId)->first();
        
        $xpEarned = 10; 
        $newXp = (int)($userRecord->xp ?? 0) + $xpEarned;
        $newLevel = (int)($userRecord->level ?? 1);
        
        // Level up check
        while ($newXp >= 100) {
            $newLevel += 1;
            $newXp -= 100;
        }

        DB::table('users')->where('id', $userId)->update([
            'xp' => $newXp,
            'level' => $newLevel
        ]);

        return response()->json([
            'message' => 'Habit completed',
            'streak' => $habit->streak,
            'gamification' => [
                'xp_awarded' => $xpEarned,
                'total_xp' => $newXp,
                'current_level' => $newLevel
            ]
        ]);
    }

    // Delete habit
    public function destroy($id)
    {
        $habit = Habit::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $habit->delete();

        // 🚀 GLOBAL XP DECREASE LOGIC (-10 XP)
        $userId = auth()->id();
        $userRecord = DB::table('users')->where('id', $userId)->first();
        
        $xpLost = 10; 
        $newXp = (int)($userRecord->xp ?? 0) - $xpLost;
        $newLevel = (int)($userRecord->level ?? 1);

        // Level down check
        while ($newXp < 0 && $newLevel > 1) {
            $newLevel -= 1;
            $newXp += 100;
        }

        // Safety Net
        if ($newXp < 0 && $newLevel === 1) {
            $newXp = 0;
        }

        DB::table('users')->where('id', $userId)->update([
            'xp' => $newXp,
            'level' => $newLevel
        ]);

        return response()->json([
            'message' => 'Habit deleted successfully',
            'gamification' => [
                'xp_lost' => $xpLost,
                'total_xp' => $newXp,
                'current_level' => $newLevel
            ]
        ]);
    }
}