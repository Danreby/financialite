<?php

use App\Providers\AppServiceProvider;
use App\Providers\SecurityServiceProvider;
use App\Providers\ServiceBindingProvider;

return [
    AppServiceProvider::class,
    SecurityServiceProvider::class,
    ServiceBindingProvider::class,
];
