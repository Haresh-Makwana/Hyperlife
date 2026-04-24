<?php

namespace App\Services;

use App\Models\Planet;
use App\Models\Activity;
use Carbon\Carbon;

class PlanetEngine
{
    /**
     * Update planet score and log activity
     */
    public function updatePlanet(
        int $userId,
        string $planetKey,
        int $scoreChange,
        string $activityType,
        array $meta = []
    ): void {
        // Find planet
        $planet = Planet::where('key', $planetKey)->firstOrFail();

        // Get user planet state (or create)
        $state = $planet->userStates()
            ->where('user_id', $userId)
            ->first();

        if (!$state) {
            $state = $planet->userStates()->create([
                'user_id' => $userId,
                'score' => 50,
                'xp' => 0,
                'level' => 1,
            ]);
        }

        // Update score safely (0–100)
        $newScore = $state->score + $scoreChange;
        $state->score = max(0, min(100, $newScore));

        // XP logic
        $state->xp += abs($scoreChange) * 2;

        // Level logic (simple)
        $state->level = floor($state->xp / 100) + 1;

        $state->updated_at = Carbon::now();
        $state->save();

        // Log activity
        Activity::create([
            'user_id' => $userId,
            'planet_id' => $planet->id,
            'type' => $activityType,
            'meta' => json_encode($meta),
        ]);
    }
}
