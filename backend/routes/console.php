<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// Your existing uplink
Schedule::command('system:uplink')->dailyAt('07:00');

// 🚀 NEW: Run the garbage collector every midnight
Schedule::command('system:purge-ghosts')->daily();

