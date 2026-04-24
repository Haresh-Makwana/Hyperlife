<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Universe extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 
        'name'
    ];

    // ✅ THIS IS THE FIX: Tell Laravel how to find the planets!
    public function planets()
    {
        return $this->hasMany(Planet::class);
    }
}