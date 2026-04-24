<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_nodes', function (Blueprint $table) {
            $table->id();
            
            // 🚀 Links the custom node directly to the specific operator
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); 
            
            // Node Physics & Telemetry
            $table->string('name');
            $table->string('type')->default('Custom');
            $table->float('size')->default(1.5); // Initial mass
            $table->integer('streak')->default(1); // Starting moons
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_nodes');
    }
};