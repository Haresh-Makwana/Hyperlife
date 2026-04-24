<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Planet extends Model
{
    use HasFactory;

    // ✅ Whitelist all the 3D AND the gamification properties
    protected $fillable = [
        'universe_id', 
        'key', 
        'name', 
        'type', 
        'size', 
        'position_x', 
        'position_y', 
        'position_z',
        // 🚀 NEW: Gamification Fields merged into your 3D system
        'domain',
        'current_xp',
        'target_xp'
    ];

    // 🚀 THE FIX: This relationship connects the Planet to the Universe.
    // This is required for the Daily Telemetry cron job to work!
    public function universe()
    {
        return $this->belongsTo(Universe::class);
    }
}