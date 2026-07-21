<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});


Route::get('/login', function () {
    return redirect('https://hyperlife-lemon.vercel.app/login');
});

Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'core' => 'HyperLife Backend Engine Active',
        'client_uplink' => env('FRONTEND_URL')
    ]);
});

require __DIR__.'/auth.php';
