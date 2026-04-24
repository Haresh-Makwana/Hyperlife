<?php

namespace App\Traits;

use App\Models\User;

trait GamificationEngine
{
    /**
     * Award XP, calculate level ups, and save securely.
     */
    public function awardXP(User $user, int $xpToAdd)
    {
        // 1. Add the XP
        $user->xp = (int)($user->xp ?? 0) + $xpToAdd;
        $leveledUp = false;

        // 2. The Level Up Math (Every 100 XP = 1 Level)
        while ($user->xp >= 100) {
            $user->level = (int)($user->level ?? 1) + 1;
            $user->xp -= 100; // Reset the bar out of 100
            $leveledUp = true;
        }

        // 3. Save to database securely
        $user->save();

        // 4. Return the data payload for React
        return [
            'xp_awarded' => $xpToAdd,
            'total_xp' => $user->xp,
            'current_level' => $user->level,
            'leveled_up' => $leveledUp
        ];
    }
}