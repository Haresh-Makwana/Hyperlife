<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Planet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * 1. Dedicated Admin Login (Used by AdminLogin.jsx)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password) || $user->role !== 'admin') {
            return response()->json(['message' => 'Login failed. Invalid credentials or insufficient clearance.'], 401);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Admin Access Granted',
            'token' => $token,
            'user' => $user
        ]);
    }

    /**
     * 2. Public System Status (Used by both Admin and User Dashboards to check for Blackouts/Announcements)
     */
    public function getSystemStatus()
    {
        return response()->json([
            'directive' => Cache::get('system_directive', null),
            'blackout' => Cache::get('system_blackout', false)
        ]);
    }

    /**
     * 3. Fetch global system telemetry for the top dashboard cards and charts.
     */
    public function getOverview()
    {
        $totalUsers = User::count();
        $totalPlanets = Planet::count();
        $totalHabits = DB::table('habits')->count(); 
        $globalXp = User::sum('xp');

        // Operator Growth (Users joining grouped by date - Last 7 Days)
        $userGrowth = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // Domain Distribution (What are users focusing on?)
        // Note: Using your existing 'domain' column logic here
        $domainStats = Planet::select('domain', DB::raw('count(*) as count'))
            ->groupBy('domain')
            ->get();

        // Fallback if 'domain' is empty but 'type' is populated
        if ($domainStats->isEmpty()) {
            $domainStats = Planet::select('type as domain', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get();
        }

        return response()->json([
            'total_users' => $totalUsers,
            'total_planets' => $totalPlanets,
            'total_habits' => $totalHabits,
            'global_xp' => $globalXp,
            'chart_user_growth' => $userGrowth,
            'chart_domains' => $domainStats
        ]);
    }

    /**
     * 4. Fetch all registered users for the directory table.
     */
    public function getUsers()
    {
        $users = User::select('id', 'name', 'email', 'role', 'xp', 'level')->get();
        return response()->json($users);
    }

    /**
     * 5. Update a user's XP, Level, or Role (Used by the XP Airdrop and User Deep-Dive).
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $validated = $request->validate([
            'role' => 'sometimes|string|in:admin,user',
            'xp' => 'sometimes|integer',
            'level' => 'sometimes|integer'
        ]);

        // Auto-calculate level if XP is being manually injected by admin
        if ($request->has('xp') && !$request->has('level')) {
            $validated['level'] = floor($request->xp / 100) + 1;
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User parameters updated successfully.',
            'user' => $user
        ]);
    }

    /**
     * 6. Delete a user from the system.
     */
    public function deleteUser(Request $request, $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Prevent the admin from accidentally deleting themselves
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot delete your own admin account.'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully.']);
    }

    /**
     * 7. Fetch every planet across all users for 3D rendering.
     */
    public function getOmniverse()
    {
        $planets = DB::table('planets')
            ->join('universes', 'planets.universe_id', '=', 'universes.id')
            ->join('users', 'universes.user_id', '=', 'users.id')
            ->select(
                'planets.id', 
                'planets.name as planet_name', 
                'planets.type', 
                'planets.size', 
                'planets.position_x', 
                'planets.position_y', 
                'planets.position_z',
                'users.name as owner_name', 
                'users.id as owner_id'
            )
            ->get();

        return response()->json($planets);
    }
    
    /**
     * 8. Fetch the 30 most recent global activities.
     */
    public function getLiveFeed()
    {
        $feed = DB::table('activities')
            ->join('users', 'activities.user_id', '=', 'users.id')
            ->select(
                'activities.id', 
                // Checking for title first, fallback to name depending on your DB
                DB::raw('COALESCE(activities.title, activities.name) as action_name'), 
                'activities.created_at', 
                'users.name as operator_name',
                'users.id as operator_id'
            )
            ->orderBy('activities.created_at', 'desc')
            ->limit(30)
            ->get();

        return response()->json($feed);
    }

    /**
     * 9. Transmit a system-wide announcement.
     */
    public function setDirective(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:500'
        ]);

        // Store the directive in the system cache for 24 hours
        Cache::put('system_directive', $request->message, now()->addHours(24));

        return response()->json([
            'status' => 'success',
            'message' => 'System announcement transmitted to all users.',
            'directive' => $request->message
        ]);
    }

    /**
     * 10. Lock out all standard users from the system.
     */
    public function toggleBlackout(Request $request)
    {
        $currentState = Cache::get('system_blackout', false);
        $newState = !$currentState;
        
        Cache::put('system_blackout', $newState, now()->addHours(24));

        return response()->json([
            'status' => 'success',
            'blackout_active' => $newState,
            'message' => $newState ? 'SYSTEM LOCKDOWN INITIATED.' : 'SYSTEM RESTORED.'
        ]);
    }

    /**
     * 11. Fetch a specific user's recent activities.
     */
    public function getUserActivities($id)
    {
        $activities = DB::table('activities')
            ->where('user_id', $id)
            ->orderBy('created_at', 'desc')
            ->limit(20) 
            ->get();

        return response()->json($activities);
    }
}