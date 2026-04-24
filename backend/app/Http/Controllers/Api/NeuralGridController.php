<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Skill;
use App\Models\Activity;

class NeuralGridController extends Controller
{
    public function index() {
        return response()->json(Skill::where('user_id', auth()->id())->get());
    }

    public function store(Request $request) {
        $request->validate([
            'domain' => 'required|string', 
            'name' => 'required|string|max:50'
        ]);

        $skill = Skill::create([
            'user_id' => auth()->id(),
            'domain' => strtolower($request->domain),
            'name' => $request->name,
            'level' => 1,
            'xp' => 0
        ]);

        return response()->json($skill);
    }

    public function injectXp($id, Request $request) {
        $request->validate(['xp_gained' => 'required|integer']);
        $skill = Skill::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        
        $addedXp = $request->xp_gained;
        $skill->xp += $addedXp;
        $leveledUp = false;

        // Level up logic (Every 100 XP = 1 Skill Level)
        while ($skill->xp >= 100) {
            $skill->level += 1;
            $skill->xp -= 100;
            $leveledUp = true;
        }

        $skill->save();

        // Auto-log to the global activity feed
        Activity::create([
            'user_id' => auth()->id(),
            'title' => "Trained Skill: " . $skill->name,
            'description' => "Injected +" . $addedXp . " XP into the Neural Grid.",
            'energy_level' => 5, 'mood_level' => 5, 'activity_date' => now()
        ]);

        return response()->json([
            'message' => $leveledUp ? "SKILL LEVEL UP: {$skill->name} is now LVL {$skill->level}!" : "XP Injected.",
            'skill' => $skill
        ]);
    }
    
    public function destroy($id) {
        Skill::where('id', $id)->where('user_id', auth()->id())->delete();
        return response()->json(['message' => 'Skill Node Eradicated.']);
    }
}