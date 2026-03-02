<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'transacoes/*', 'transacoes', 'categories/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Authorization'],

    'max_age' => 86400,

    'supports_credentials' => true,

];
