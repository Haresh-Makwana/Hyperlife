<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanetProgress extends Model
{
    use HasFactory;

    protected $table = 'planet_progress';

    // ✅ Disables Laravel's mass-assignment blocks
    protected $guarded = []; 

    // ✅ Forces Laravel to instantly convert your JSON array into a database-friendly format
    protected $casts = [
        'details' => 'array',
    ];
}