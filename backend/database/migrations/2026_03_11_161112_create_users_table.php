<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique(); // ✅ THIS FIXES YOUR FRONTEND ERROR
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            
            // ✅ HYPERLIFE GAMIFICATION SYSTEM
            $table->integer('xp')->default(0);
            $table->integer('level')->default(1);
            
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};