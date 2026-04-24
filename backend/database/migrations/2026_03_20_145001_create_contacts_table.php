<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name');    // For "Operator Name"
            $table->string('email');   // For "Comms Address"
            $table->text('message');   // For "Encrypted Message"
            $table->timestamps();      // Automatically adds 'created_at' and 'updated_at'
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};