<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains security-related configuration options for the
    | application including rate limiting, input sanitization, and logging.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Configure rate limiting for various actions in the application.
    | Each action can have its own limit and decay period.
    |
    */
    'rate_limits' => [
        'login' => [
            'max_attempts' => 5,
            'decay_minutes' => 1,
        ],
        'register' => [
            'max_attempts' => 3,
            'decay_minutes' => 1,
        ],
        'password_reset' => [
            'max_attempts' => 3,
            'decay_minutes' => 1,
        ],
        'api' => [
            'max_attempts' => 60,
            'decay_minutes' => 1,
        ],
        'import' => [
            'max_attempts' => 10,
            'decay_minutes' => 5,
        ],
        'export' => [
            'max_attempts' => 20,
            'decay_minutes' => 5,
        ],
        'create' => [
            'max_attempts' => 30,
            'decay_minutes' => 1,
        ],
        'update' => [
            'max_attempts' => 60,
            'decay_minutes' => 1,
        ],
        'delete' => [
            'max_attempts' => 20,
            'decay_minutes' => 1,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Input Sanitization
    |--------------------------------------------------------------------------
    |
    | Configure input sanitization options.
    |
    */
    'sanitization' => [
        // Fields that should never be sanitized
        'except' => [
            'password',
            'password_confirmation',
            'current_password',
            '_token',
            'email',
        ],

        // Whether to strip HTML tags from all input
        'strip_tags' => false,

        // Whether to convert special characters to HTML entities
        'html_encode' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Logging
    |--------------------------------------------------------------------------
    |
    | Configure security event logging options.
    |
    */
    'logging' => [
        // Enable or disable security logging
        'enabled' => env('SECURITY_LOGGING_ENABLED', true),

        // Log channel for security events
        'channel' => env('SECURITY_LOG_CHANNEL', 'security'),

        // Events to log
        'events' => [
            'authentication' => true,
            'authorization' => true,
            'rate_limiting' => true,
            'suspicious_activity' => true,
            'data_access' => true,
            'validation_failures' => true,
        ],

        // Whether to hash IP addresses in logs (for privacy)
        'hash_ip' => env('SECURITY_HASH_IP', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Session Security
    |--------------------------------------------------------------------------
    |
    | Configure session security options.
    |
    */
    'session' => [
        // Regenerate session ID on login
        'regenerate_on_login' => true,

        // Invalidate session on logout
        'invalidate_on_logout' => true,

        // Maximum session lifetime in minutes
        'lifetime' => env('SESSION_LIFETIME', 120),
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Security
    |--------------------------------------------------------------------------
    |
    | Configure password security requirements.
    |
    */
    'password' => [
        'min_length' => 8,
        'require_mixed_case' => true,
        'require_numbers' => true,
        'require_symbols' => false,
        'uncompromised' => env('APP_ENV') === 'production',
    ],

    /*
    |--------------------------------------------------------------------------
    | CORS Configuration
    |--------------------------------------------------------------------------
    |
    | Configure Cross-Origin Resource Sharing settings.
    |
    */
    'cors' => [
        'allowed_origins' => [
            env('APP_URL', 'http://localhost'),
        ],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-TOKEN'],
        'max_age' => 86400,
    ],

    /*
    |--------------------------------------------------------------------------
    | Content Security Policy
    |--------------------------------------------------------------------------
    |
    | Configure Content Security Policy headers.
    |
    */
    'csp' => [
        'enabled' => env('CSP_ENABLED', false),
        'report_only' => env('CSP_REPORT_ONLY', true),
        'report_uri' => env('CSP_REPORT_URI', null),
        'directives' => [
            'default-src' => ["'self'"],
            'script-src' => ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            'style-src' => ["'self'", "'unsafe-inline'", 'https://fonts.bunny.net'],
            'style-src-elem' => ["'self'", "'unsafe-inline'", 'https://fonts.bunny.net'],
            'img-src' => ["'self'", 'data:', 'https:', 'blob:'],
            'font-src' => ["'self'", 'https://fonts.bunny.net', 'https://fonts.gstatic.com', 'data:'],
            'connect-src' => ["'self'", 'ws://localhost:5173', 'http://localhost:5173'],
            'frame-ancestors' => ["'none'"],
            'base-uri' => ["'self'"],
            'form-action' => ["'self'"],
            'object-src' => ["'none'"],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Suspicious Activity Detection
    |--------------------------------------------------------------------------
    |
    | Configure how the application handles detected suspicious activity.
    |
    */
    'suspicious_activity' => [
        // Block requests with suspicious activity
        'block_requests' => env('SECURITY_BLOCK_SUSPICIOUS', true),

        // Block only critical threats (SQL injection, path traversal)
        // If false, also blocks XSS attempts
        'block_only_critical' => env('SECURITY_BLOCK_CRITICAL_ONLY', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | SSRF Protection
    |--------------------------------------------------------------------------
    |
    | Configure Server-Side Request Forgery protection.
    |
    */
    'ssrf' => [
        'enabled' => env('SSRF_PROTECTION_ENABLED', true),
        'block_private_networks' => true,
        'block_reserved_ranges' => true,
    ],
];
