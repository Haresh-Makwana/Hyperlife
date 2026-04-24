<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::create('duels', function (Blueprint $table) {
        $table->id();
        $table->foreignId('challenger_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('opponent_id')->constrained('users')->onDelete('cascade');
        $table->string('title'); // e.g., "7 Days of Gym"
        $table->integer('wager'); // XP wagered
        $table->enum('status', ['pending', 'active', 'completed', 'declined'])->default('pending');
        $table->integer('challenger_score')->default(0);
        $table->integer('opponent_score')->default(0);
        $table->integer('target_score'); // What score wins the duel? (e.g., 7 check-ins)
        $table->foreignId('winner_id')->nullable()->constrained('users')->onDelete('set null');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('duels');
    }
};
