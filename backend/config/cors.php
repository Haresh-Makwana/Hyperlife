<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // 🚀 THE SHIELD: No more wildcards. 
    // Only these exact URLs are allowed to speak to your database.
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'), 
        'http://localhost:3000', // Keeping your local dev environment open
        
        // 🔒 Uncomment and add your exact Vercel URL here before pushing to InfinityFree!
        'https://hyperlife-lemon.vercel.app', 
    ],

    'allowed_origins_patterns' => [],

    'allowed_methods' => ['*'], // Standard REST methods (GET, POST, PUT, DELETE) are safe to leave open

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // Required for Sanctum authentication

];