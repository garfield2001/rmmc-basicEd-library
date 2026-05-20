<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light dark">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.display_name', 'RMMC Basic Education Library') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        <script>
            (() => {
                document.documentElement.style.colorScheme = 'only light';

                if (!window.location.pathname.startsWith('/admin')) {
                    return;
                }

                try {
                    const key = 'rmmc-admin-theme-preference-v2';
                    const preference = window.localStorage.getItem(key);
                    const theme = preference === 'light' || preference === 'dark'
                        ? preference
                        : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

                    document.documentElement.dataset.adminTheme = theme;
                    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'only light';
                } catch {
                    document.documentElement.dataset.adminTheme = 'light';
                    document.documentElement.style.colorScheme = 'only light';
                }
            })();
        </script>

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
