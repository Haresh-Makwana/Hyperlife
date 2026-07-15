<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});


Route::get('/login', function () {
    return redirect('https://hyperlife-lemon.vercel.app/login');
});

// 🚀 THE FIX: This forces Laravel to serve your React UI for any route that isn't an API call.
Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');

require __DIR__.'/auth.php';
