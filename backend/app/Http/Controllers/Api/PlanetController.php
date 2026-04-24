<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Planet;
use Illuminate\Http\Request;

class PlanetController extends Controller
{
    public function index(Request $request)
    {
        try {
            $planets = Planet::whereHas('universe', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })->get();

            return response()->json($planets, 200);

        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to fetch planets', 'message' => $e->getMessage()], 500);
        }
    }

    public function byUniverse(Request $request, $universeId)
    {
        try {
            $planets = Planet::where('universe_id', $universeId)
                ->whereHas('universe', function($q) use($request) {
                    $q->where('user_id', $request->user()->id);
                })->get();

            return response()->json(['planets' => $planets], 200);

        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to fetch planets', 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'universe_id' => 'required|exists:universes,id',
            'key'         => 'required|string|max:255',
            'name'        => 'required|string|max:255',
            'type'        => 'required|string|max:100',
            'size'        => 'required|numeric|min:1',
            'position_x'  => 'required|numeric',
            'position_y'  => 'required|numeric',
            'position_z'  => 'required|numeric',
            'domain'      => 'required|string',
            'target_xp'   => 'required|integer|min:100'
        ]);

        try {
            $user = $request->user();

            // 🚀 SUBSCRIPTION GATEKEEPER: Planet Capacity Limit
            if (!$user->canCreateUnlimitedUniverses()) {
                $planetCount = Planet::whereHas('universe', function($q) use($user) {
                    $q->where('user_id', $user->id);
                })->count();

                // Operator (Free) = 5 Nodes, Navigator = 15 Nodes, Commander = Unlimited
                $maxNodes = ($user->plan_name === 'navigator') ? 15 : 5;

                if ($planetCount >= $maxNodes) {
                    return response()->json([
                        'error' => 'UPGRADE_REQUIRED',
                        'message' => "Matrix Capacity Reached. Your current tier is limited to {$maxNodes} active nodes. Upgrade to expand your universe."
                    ], 403);
                }
            }

            $planet = Planet::create([
                'universe_id' => $request->universe_id,
                'key'         => $request->key, 
                'name'        => $request->name,
                'type'        => $request->type,
                'size'        => $request->size,
                'position_x'  => $request->position_x,
                'position_y'  => $request->position_y,
                'position_z'  => $request->position_z,
                'domain'      => strtolower($request->domain),
                'target_xp'   => $request->target_xp,
                'current_xp'  => 0 
            ]);

            return response()->json(['message' => 'Planet created successfully', 'planet' => $planet], 201);

        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to create planet', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $planet = Planet::whereHas('universe', function($q) use($request) {
                $q->where('user_id', $request->user()->id);
            })->findOrFail($id);
            
            $planet->delete();
            return response()->json(['message' => 'Planet destroyed.']);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to destroy planet or unauthorized'], 500);
        }
    }
}