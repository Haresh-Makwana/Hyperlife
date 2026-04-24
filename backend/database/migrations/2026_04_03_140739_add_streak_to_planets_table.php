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
        Schema::table('planets', function (Blueprint $table) {
            // Safely adds the streak column if it doesn't already exist
            if (!Schema::hasColumn('planets', 'streak')) {
                $table->integer('streak')->default(1);
            }
        });
    }

    public function down(): void
    {
        Schema::table('planets', function (Blueprint $table) {
            if (Schema::hasColumn('planets', 'streak')) {
                $table->dropColumn('streak');
            }
        });
    }

};
