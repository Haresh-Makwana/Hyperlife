<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});


Route::get('/login', function () {
    return redirect('http://localhost:5173/login');
});



require __DIR__.'/auth.php';
