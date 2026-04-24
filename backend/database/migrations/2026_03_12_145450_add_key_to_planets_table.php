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
        // Add this IF statement to check if the column already exists
        if (!Schema::hasColumn('planets', 'key')) {
            Schema::table('planets', function (Blueprint $table) {
                // Keep whatever your original line was here! It probably looks like this:
                $table->string('key')->after('id'); 
            });
        }
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('planets', function (Blueprint $table) {
            $table->dropColumn('key');
        });
    }
};