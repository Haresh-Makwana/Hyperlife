<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Habit extends Model
{
    protected $fillable = [
        'user_id',
        'planet_id',
        'title',
        'xp_reward',
        'streak',
        'last_completed_at'
    ];

    public function planet()
    {
        return $this->belongsTo(Planet::class);
    }
}
