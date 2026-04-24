<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Universe;
use Illuminate\Http\Request;

class UniverseController extends Controller
{
    // Fetch universes for the dropdown
    public function index(Request $request)
    {
        return response()->json([
            'universes' => Universe::where('user_id', $request->user()->id)->get()
        ]);
    }

    // Creates the initial universe during Registration
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $universe = Universe::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
        ]);

        return response()->json(['universe' => $universe], 201);
    }

    // ✅ THIS METHOD GENERATES THE SUMMARY FOR REACT
    public function summary(Request $request, $id)
    {
        // 🚀 SECURE FIX: Now ensures the universe belongs to the logged-in user!
        $universe = Universe::where('user_id', $request->user()->id)
                            ->with('planets')
                            ->find($id);
        
        if (!$universe) {
            return response()->json(['summary' => 'Constellation not found.'], 404);
        }

        $planetCount = $universe->planets->count();

        return response()->json([
            'summary' => "Constellation Active. Orbiting {$planetCount} celestial bodies."
        ]);
    }
}