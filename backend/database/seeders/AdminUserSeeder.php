<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin already exists to prevent duplicates if you run it twice
        $admin = User::where('email', 'admin@hyperlife.com')->first();

        if (!$admin) {
            User::create([
                'name' => 'System Admin',
                'email' => 'admin@hyperlife.com', // Use this to log into the React dashboard
                'password' => Hash::make('hyperlife2026'), // Your secure admin password
                'role' => 'admin', // The critical role flag
                'xp' => 0,
                'level' => 1
            ]);
        }
    }
}