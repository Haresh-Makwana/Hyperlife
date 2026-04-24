<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Duel;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ColosseumController extends Controller
{
    // Get all operators to challenge (except yourself)
    public function operators() {
        return response()->json(User::where('id', '!=', auth()->id())->select('id', 'name', 'level', 'xp')->get());
    }

    // Get all duels involving the user
    public function index() {
        $userId = auth()->id();
        $duels = Duel::with(['challenger:id,name', 'opponent:id,name', 'winner:id,name'])
            ->where('challenger_id', $userId)
            ->orWhere('opponent_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($duels);
    }

    // Issue a challenge
    public function challenge(Request $request) {
        $request->validate([
            'opponent_id' => 'required|exists:users,id',
            'title' => 'required|string|max:50',
            'wager' => 'required|integer|min:50',
            'target_score' => 'required|integer|min:1'
        ]);

        $challenger = auth()->user();
        if ($challenger->xp < $request->wager && $challenger->level == 1) {
            return response()->json(['error' => 'Insufficient XP to make this wager.'], 400);
        }

        // Deduct wager immediately from challenger to lock it in escrow
        $this->adjustUserXp($challenger->id, -$request->wager);

        $duel = Duel::create([
            'challenger_id' => $challenger->id,
            'opponent_id' => $request->opponent_id,
            'title' => $request->title,
            'wager' => $request->wager,
            'target_score' => $request->target_score,
            'status' => 'pending'
        ]);

        return response()->json(['message' => 'Challenge issued. Wager locked in escrow.', 'duel' => $duel]);
    }

    // Accept a challenge
    public function accept($id) {
        $duel = Duel::where('id', $id)->where('opponent_id', auth()->id())->where('status', 'pending')->firstOrFail();
        $opponent = auth()->user();

        if ($opponent->xp < $duel->wager && $opponent->level == 1) {
            return response()->json(['error' => 'Insufficient XP to match this wager.'], 400);
        }

        // Match the wager
        $this->adjustUserXp($opponent->id, -$duel->wager);
        $duel->update(['status' => 'active']);

        return response()->json(['message' => 'Challenge accepted. Let the games begin.']);
    }

    // Log progress (Score a point)
    public function strike($id) {
        $userId = auth()->id();
        $duel = Duel::where('id', $id)->where('status', 'active')
            ->where(function($q) use ($userId) {
                $q->where('challenger_id', $userId)->orWhere('opponent_id', $userId);
            })->firstOrFail();

        $isChallenger = $duel->challenger_id == $userId;

        if ($isChallenger) {
            $duel->challenger_score += 1;
            if ($duel->challenger_score >= $duel->target_score) {
                $this->resolveDuel($duel, $userId);
                return response()->json(['message' => 'VICTORY! You have crushed your opponent and claimed the pot.']);
            }
        } else {
            $duel->opponent_score += 1;
            if ($duel->opponent_score >= $duel->target_score) {
                $this->resolveDuel($duel, $userId);
                return response()->json(['message' => 'VICTORY! You have crushed your opponent and claimed the pot.']);
            }
        }

        $duel->save();
        return response()->json(['message' => 'Strike landed. Score updated.']);
    }

    // Helper: Safely add/subtract XP and handle level ups/downs
    private function adjustUserXp($userId, $amount) {
        $user = User::find($userId);
        $newXp = (int)$user->xp + $amount;
        $newLevel = (int)$user->level;

        while ($newXp >= 100) { $newLevel++; $newXp -= 100; }
        while ($newXp < 0 && $newLevel > 1) { $newLevel--; $newXp += 100; }
        if ($newXp < 0 && $newLevel == 1) $newXp = 0;

        $user->update(['xp' => $newXp, 'level' => $newLevel]);
    }

    // Helper: Pay out the winner
    private function resolveDuel($duel, $winnerId) {
        $duel->status = 'completed';
        $duel->winner_id = $winnerId;
        $duel->save();

        // Winner takes both wagers (the pot)
        $pot = $duel->wager * 2;
        $this->adjustUserXp($winnerId, $pot);
    }

    public function getOperators(Request $request)
    {
        // 🚀 THE FIX: Only fetch users who have actually verified their emails!
        // We also exclude the currently logged-in user so they can't duel themselves.
        $operators = User::whereNotNull('email_verified_at')
                         ->where('id', '!=', $request->user()->id)
                         ->get(['id', 'name', 'level', 'xp']); 

        return response()->json($operators);
    }
    
}


