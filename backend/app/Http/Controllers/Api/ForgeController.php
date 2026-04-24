<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\CustomNode; // For Custom Planets
use App\Models\Planet;     // For Core Planets
use App\Models\Universe;   // For Core Universe

class ForgeController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | 🌌 CORE PLANETS PROTOCOLS (Health, Finance, Knowledge)
    |--------------------------------------------------------------------------
    */

    /**
     * FETCH & INITIALIZE CORE PLANETS (Fixes the duplication bug)
     */
    public function getCorePlanets(Request $request)
    {
        $user = $request->user();

        // 1. Get or Create the Universe safely
        $universe = Universe::firstOrCreate(
            ['user_id' => $user->id],
            ['name' => $user->name . "'s Constellation"]
        );

        // 2. Define the 3 Core Nodes
        $coreNodes = [
            ['name' => 'Vitality Sphere', 'type' => 'Health'],
            ['name' => 'Neural Network', 'type' => 'Knowledge'],
            ['name' => 'Asset Node', 'type' => 'Finance'],
        ];

        // 3. Bulletproof Initialization (Guarantees only ONE of each core planet)
        foreach ($coreNodes as $node) {
            Planet::firstOrCreate(
                [
                    'universe_id' => $universe->id,
                    'type' => $node['type'] // Strict lock: Only 1 of each type allowed
                ],
                [
                    'name' => $node['name'],
                    'size' => 1.5,
                    'streak' => 1
                ]
            );
        }

        // 4. Fetch and return the finalized solar system
        $planets = Planet::where('universe_id', $universe->id)->get();

        return response()->json($planets);
    }

    /**
     * 💥 ERADICATION PROTOCOL: Destroy a Core Planet securely.
     */
    public function destroyCoreNode(Request $request, $id)
    {
        // Find the planet ONLY if it belongs to the authenticated user's universe
        $planet = Planet::whereHas('universe', function ($query) use ($request) {
            $query->where('user_id', $request->user()->id);
        })->where('id', $id)->first();

        if (!$planet) {
            return response()->json(['message' => 'System Error: Node not found or unauthorized access.'], 404);
        }

        $planet->delete();

        return response()->json(['message' => 'Node eradicated successfully.']);
    }

    /*
    |--------------------------------------------------------------------------
    | 🚀 CUSTOM FORGE NODES PROTOCOLS
    |--------------------------------------------------------------------------
    */

    // 1. Save the new custom planet
    public function igniteNode(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $node = CustomNode::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'type' => 'Custom',
            'size' => 1.5,
            'streak' => 1,
        ]);

        return response()->json(['planet' => $node], 201);
    }

    // 2. Fetch the custom planets for the 3D Universe
    public function getNodes(Request $request)
    {
        $nodes = CustomNode::where('user_id', $request->user()->id)->get();
        return response()->json($nodes);
    }

    /**
     * 💥 ERADICATION PROTOCOL: Destroy a custom node.
     */
    public function destroyNode(Request $request, $id)
    {
        // Find the node, ensuring it belongs to the authenticated user
        $node = CustomNode::where('user_id', $request->user()->id)
                          ->where('id', $id)
                          ->first();

        if (!$node) {
            return response()->json(['message' => 'Node not found or unauthorized.'], 404);
        }

        $node->delete();

        return response()->json(['message' => 'Node eradicated successfully.']);
    }

    /*
    |--------------------------------------------------------------------------
    | 🧬 SHARED PHYSICS PROTOCOLS (Works for Core & Custom)
    |--------------------------------------------------------------------------
    */

    /**
     * INJECT MASS: Grows a planet's size and streak based on transmitted data.
     */
    public function injectMass(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'is_custom' => 'required|boolean',
            'xp_gained' => 'required|numeric'
        ]);

        // Calculate growth: 10 XP = 0.2 size increase. Minimum growth of 0.1
        $massIncrease = max(0.1, $request->xp_gained * 0.02); 

        if ($request->is_custom) {
            // Find Custom Node
            $node = CustomNode::where('id', $request->id)
                        ->where('user_id', $request->user()->id)
                        ->first();
        } else {
            // Find Core Planet (Health, Finance, Knowledge)
            $universeIds = DB::table('universes')
                        ->where('user_id', $request->user()->id)
                        ->pluck('id');
                        
            $node = Planet::where('id', $request->id)
                        ->whereIn('universe_id', $universeIds)
                        ->first();
        }

        if ($node) {
            $node->size += $massIncrease;
            $node->streak += 1; // Add a new moon for logging an action!
            $node->save();

            return response()->json([
                'message' => 'Mass injected successfully.',
                'new_size' => $node->size,
                'new_streak' => $node->streak
            ]);
        }

        return response()->json(['message' => 'Node not found or unauthorized.'], 404);
    }
}