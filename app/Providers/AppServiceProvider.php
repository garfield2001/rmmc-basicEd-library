<?php

namespace App\Providers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::usePreloadTagAttributes(function (string $src, string $url): array|false {
            return str_ends_with(parse_url($url, PHP_URL_PATH) ?: $url, '.css') ? false : [];
        });

        Schema::defaultStringLength(120);
    }
}
