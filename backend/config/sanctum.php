<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend SPA.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:3000,https://hyperlife-backend.onrender.com,::1',
        Sanctum::currentApplicationUrlWithPort(),
        env('FRONTEND_URL') ? ','.parse_url(env('FRONTEND_URL'), PHP_URL_HOST) : ''
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that will be checked when
    | Sanctum is trying to authenticate a request. If none of these guards
    | are able to authenticate the request, Sanctum will use the bearer
    | token that's present on an incoming request for authentication.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes (THE VAULT TIMER)
    |--------------------------------------------------------------------------
    |
    | 🔒 THE SHIELD: Tokens will now automatically self-destruct after 24 hours 
    | (1440 minutes). You can override this in your .env file using 
    | SANCTUM_TOKEN_EXPIRATION if you want them to last longer (e.g., 10080 for a week).
    |
    */

    'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 1440),

    /*
    |--------------------------------------------------------------------------
    | Token Prefix (THE TRACKER)
    |--------------------------------------------------------------------------
    |
    | 🔒 THE SHIELD: Adding a 'hl_os_' prefix to all generated tokens. If you 
    | or a teammate accidentally paste a token into a public GitHub repo, 
    | secret-scanning bots will instantly flag it as a HyperLife OS token.
    |
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', 'hl_os_'),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | When authenticating your first-party SPA with Sanctum you may need to
    | customize some of the middleware Sanctum uses while processing the
    | request. You may change the middleware listed below as required.
    |
    */

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];