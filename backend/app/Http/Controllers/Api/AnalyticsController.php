<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function weekly(Request $request)
    {
        $userId = $request->user()->id;
        
        // Get activities from the last 7 days
        $activities = Activity::where('user_id', $userId)
            ->where('activity_date', '>=', Carbon::now()->subDays(6)->startOfDay())
            ->get();

        $chartData = [];

        // Loop through the last 7 days to build the chart data
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $dayName = Carbon::now()->subDays($i)->format('D'); // e.g., "Mon", "Tue"
            
            $dailyActs = $activities->where('activity_date', $date);
            
            $chartData[] = [
                'name' => $dayName,
                'activities' => $dailyActs->count(),
                'mood' => $dailyActs->avg('mood_level') ? round($dailyActs->avg('mood_level'), 1) : 0,
                'energy' => $dailyActs->avg('energy_level') ? round($dailyActs->avg('energy_level'), 1) : 0
            ];
        }

        return response()->json($chartData);
    }
}