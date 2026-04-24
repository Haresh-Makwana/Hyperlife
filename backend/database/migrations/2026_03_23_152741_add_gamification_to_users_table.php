<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            
            // 🛑 BUG FIX: Check if 'xp' already exists from the earlier migration
            // If it doesn't exist, create it. If it does, skip it and prevent the crash!
            if (!Schema::hasColumn('users', 'xp')) {
                $table->integer('xp')->default(0);
            }

            // ADD YOUR OTHER GAMIFICATION COLUMNS BELOW
            // I'm assuming you have things like 'level' or 'streak' in this file.
            // Wrap them in similar checks just to be 100% safe.
            
            if (!Schema::hasColumn('users', 'level')) {
                $table->integer('level')->default(1); // Adjust default value as needed
            }
            
            // Example:
            // if (!Schema::hasColumn('users', 'streak')) {
            //     $table->integer('streak')->default(0);
            // }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Safely drop the columns during rollback
            if (Schema::hasColumn('users', 'level')) {
                $table->dropColumn('level');
            }
            
            // Note: We don't drop 'xp' here because it belongs to your earlier migration
            // (2026_03_11_161219_add_xp_to_users_table).
        });
    }
};