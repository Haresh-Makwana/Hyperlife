<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlanetProgress;
use App\Models\Planet;
use Illuminate\Http\Request;

class PlanetProgressController extends Controller
{
    public function index($planetId)
    {
        try {
            $progress = PlanetProgress::where('planet_id', $planetId)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($item) {
                    $details = is_string($item->details) ? json_decode($item->details, true) : $item->details;
                    
                    return [
                        'id' => $item->id,
                        'date' => $details['date'] ?? $item->created_at->format('Y-m-d'),
                        'notes' => $details['notes'] ?? 'No notes recorded.',
                        'score' => $item->xp_added, 
                    ];
                });

            return response()->json($progress);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Load Error: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request, $planetId)
    {
        try {
            // 1. Validate data
            $request->validate([
                'score' => 'required|integer|min:1|max:10',
                'notes' => 'nullable|string',
                'date'  => 'required|date'
            ]);

            $planet = Planet::findOrFail($planetId);

            // 2. Save directly to database
            PlanetProgress::create([
                'planet_id'   => $planet->id,
                'xp_added'    => (int) $request->score,
                'action_type' => 'telemetry_log',
                'details'     => [
                    'notes' => $request->notes ?? '',
                    'date'  => $request->date
                ]
            ]);

            // 3. Inflate the Planet!
            $planet->size += ($request->score / 100);
            $planet->save();

            return response()->json(['message' => 'Success'], 201);

        } catch (\Exception $e) {
            // ✅ IF IT FAILS, THIS WILL SEND THE EXACT SQL ERROR TO YOUR REACT FRONTEND
            return response()->json(['message' => 'Backend Error: ' . $e->getMessage()], 500);
        }
    }

    // Add this right below your store() method
    public function update(Request $request, $planetId, $progressId)
    {
        try {
            $request->validate([
                'score' => 'required|integer|min:1|max:10',
                'notes' => 'nullable|string',
                'date'  => 'required|date'
            ]);

            // Find the specific progress log and the planet
            $progress = PlanetProgress::where('planet_id', $planetId)->findOrFail($progressId);
            $planet = Planet::findOrFail($planetId);

            // 1. GAMIFICATION MATH: Calculate the difference!
            $oldScore = $progress->xp_added;
            $newScore = (int) $request->score;
            $scoreDiff = $newScore - $oldScore;

            // 2. Update the progress record
            $progress->xp_added = $newScore;
            $progress->details = [
                'notes' => $request->notes ?? '',
                'date'  => $request->date
            ];
            $progress->save();

            // 3. Adjust the Planet Size based on the difference
            if ($scoreDiff !== 0) {
                $planet->size += ($scoreDiff / 100);
                
                // Prevent the planet from completely vanishing if they edit scores way down
                if ($planet->size < 0.1) {
                    $planet->size = 0.1;
                }
                $planet->save();
            }

            return response()->json(['message' => 'Telemetry Updated Successfully'], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Update Error: ' . $e->getMessage()], 500);
        }
    }

    // Add this right below your update() method
    public function destroy($planetId, $progressId)
    {
        try {
            $progress = PlanetProgress::where('planet_id', $planetId)->findOrFail($progressId);
            $planet = Planet::findOrFail($planetId);

            // 1. GAMIFICATION MATH: Shrink the planet!
            $scoreToRemove = $progress->xp_added;
            $planet->size -= ($scoreToRemove / 100);

            // Ensure the planet doesn't shrink completely out of existence (min size 0.1)
            if ($planet->size < 0.1) {
                $planet->size = 0.1;
            }
            $planet->save();

            // 2. Permanently delete the log
            $progress->delete();

            return response()->json(['message' => 'Telemetry Purged Successfully'], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Delete Error: ' . $e->getMessage()], 500);
        }
    }
    
}