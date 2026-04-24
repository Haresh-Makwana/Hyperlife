<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Reward;
use App\Models\Activity;
use Illuminate\Support\Facades\DB;

class ArsenalController extends Controller
{
    public function index() {
        return response()->json(Reward::where('user_id', auth()->id())->get());
    }

    public function store(Request $request) {
        $request->validate(['title' => 'required|string', 'cost' => 'required|integer|min:1']);
        $reward = Reward::create([
            'user_id' => auth()->id(),
            'title' => $request->title,
            'cost' => $request->cost
        ]);
        return response()->json($reward);
    }

    public function destroy($id) {
        Reward::where('id', $id)->where('user_id', auth()->id())->delete();
        return response()->json(['message' => 'Asset removed from Arsenal.']);
    }

    public function purchase($id) {
        $reward = Reward::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $user = auth()->user();

        // Calculate true total XP (Level 1 = 0, Level 2 = 100, Level 3 = 200, etc.)
        $totalUserXp = (($user->level - 1) * 100) + $user->xp;

        if ($totalUserXp < $reward->cost) {
            return response()->json(['error' => 'INSUFFICIENT XP. Grind harder.'], 400);
        }

        // 🚀 FIXED: We NO LONGER subtract XP or drop levels! 
        // Rewards are now Milestone Unlocks.

        // Auto-log the purchase as an activity
        Activity::create([
            'user_id' => $user->id,
            'title' => "Unlocked Protocol: " . $reward->title,
            'description' => "Claimed a reward from The Arsenal (" . $reward->cost . " XP Milestone).",
            'energy_level' => 5, 
            'mood_level' => 8, 
            'activity_date' => now()
        ]);

        return response()->json([
            'message' => 'Protocol Unlocked! (Your XP was not deducted)',
            'new_xp' => $user->xp,
            'new_level' => $user->level
        ]);
    }
}