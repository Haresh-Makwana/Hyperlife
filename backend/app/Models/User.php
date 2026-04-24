<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;
     
    public function planets()
    {
        return $this->hasMany(Planet::class);
    }

    protected $fillable = [
        'name',
        'email',
        'google_id', 
        'password',
        'role', // We will use 'role' to store: 'operator' (free), 'navigator', 'commander', 'syndicate', 'overwatch'
        'xp',   
        'level',
        'email_verified_at' 
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // 🚀 SUBSCRIPTION GATEKEEPER HELPERS
    // By checking an array of valid roles, higher tiers automatically get lower tier features
    
    public function getPlanNameAttribute()
    {
        // Default to 'operator' (Free tier) if the role is just standard 'user' or null
        $currentRole = strtolower($this->role ?? 'operator');
        if ($currentRole === 'user') return 'operator';
        return $currentRole;
    }

    public function canCreateMultipleUniverses()
    {
        // Navigator and above get 3+ Universes
        return in_array($this->plan_name, ['navigator', 'commander', 'syndicate', 'overwatch', 'admin']);
    }

    public function canCreateUnlimitedUniverses()
    {
        // Commander and above get Unlimited
        return in_array($this->plan_name, ['commander', 'syndicate', 'overwatch', 'admin']);
    }

    public function canUseAIInsights()
    {
        // Commander and above get Omni-Node AI
        return in_array($this->plan_name, ['commander', 'syndicate', 'overwatch', 'admin']);
    }

    public function canExportData()
    {
        // Commander and above get PDF/CSV exports
        return in_array($this->plan_name, ['commander', 'syndicate', 'overwatch', 'admin']);
    }

    public function getAnalyticsDaysLimit()
    {
        // Determines how far back they can view history
        if (in_array($this->plan_name, ['commander', 'syndicate', 'overwatch', 'admin'])) return 9999; // Unlimited
        if ($this->plan_name === 'navigator') return 30;
        return 7; // Free tier default
    }
}