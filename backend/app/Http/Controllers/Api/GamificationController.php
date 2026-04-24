<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Gamification;
use App\Models\User;

class GamificationController extends Controller
{
    /**
     * Fetch global gamification status (General)
     */
    public function status()
    {
        $data = Gamification::first();

        if (!$data) {
            $data = Gamification::create([
                'xp' => 0,
                'level' => 1
            ]);
        }

        return response()->json($data);
    }

    /**
     * Fetch current logged-in Operator's stats
     */
    public function index()
    {
        // Use the authenticated user directly
        $user = auth()->user();

        if (!$user) {
            return response()->json(['error' => 'Unidentified Operator'], 401);
        }

        return response()->json([
            'xp' => $user->xp,
            'level' => $user->level,
            'progress' => $user->xp % 100
        ]);
    }

    /**
     * 🚀 THE FIX: Fetch The Syndicate Leaderboard
     * This hides any user who hasn't verified their email.
     */
    public function leaderboard()
    {
        $topOperators = User::whereNotNull('email_verified_at') // 🛡️ Hide ghosts
            ->where('role', '!=', 'admin')             // 🛡️ Hide admins from player ranks
            ->orderBy('level', 'desc')
            ->orderBy('xp', 'desc')
            ->take(10)
            ->get(['id', 'name', 'level', 'xp', 'avatar']);

        return response()->json($topOperators);
    }
}