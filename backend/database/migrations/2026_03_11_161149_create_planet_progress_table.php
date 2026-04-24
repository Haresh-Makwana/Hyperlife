<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planet_progress', function (Blueprint $table) {
            $table->id();
            // Secure connection to the planet
            $table->foreignId('planet_id')->constrained('planets')->onDelete('cascade');
            
            // The score
            $table->integer('xp_added');
            $table->string('action_type')->default('telemetry_log');
            
            // ✅ CRITICAL FIX: The column MUST be 'json' type to hold our Date and Notes array!
            $table->json('details')->nullable(); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('planet_progress');
    }
};