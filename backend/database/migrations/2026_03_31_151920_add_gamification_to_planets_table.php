<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('planets', function (Blueprint $table) {
            $table->string('domain')->default('general');
            $table->integer('current_xp')->default(0);
            $table->integer('target_xp')->default(1000);
        });
    }
    public function down()
    {
        Schema::table('planets', function (Blueprint $table) {
            $table->dropColumn(['domain', 'current_xp', 'target_xp']);
        });
    }
};