<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Configure CSRF protection with exceptions
        $middleware->validateCsrfTokens(
            // Specify routes to exclude from CSRF protection
            except: [
                'login',
                'register',
                'auth/login',
                'auth/register',
                'logout',
                'patients/*',
                'triage',
                'queue',
                'doctor/*',
                'user'
            ]
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
