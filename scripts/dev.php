<?php

$isWindows = PHP_OS_FAMILY === 'Windows';
$pnpm = $isWindows ? 'pnpm.cmd' : 'pnpm';
$localConcurrently = __DIR__.'/../node_modules/.bin/concurrently'.($isWindows ? '.cmd' : '');
$concurrently = file_exists($localConcurrently) ? $localConcurrently : 'concurrently';

$commands = [
    'server' => 'php artisan serve',
    'queue' => 'php artisan queue:listen --tries=1',
    'reverb' => 'php artisan reverb:start --host=0.0.0.0 --port=8080',
    'vite' => $pnpm.' run dev',
];

if (function_exists('pcntl_fork')) {
    $commands = [
        'server' => $commands['server'],
        'queue' => $commands['queue'],
        'logs' => 'php artisan pail --timeout=0',
        'reverb' => $commands['reverb'],
        'vite' => $commands['vite'],
    ];
} else {
    fwrite(STDERR, "Skipping Laravel Pail because the pcntl extension is unavailable.\n");
}

$colors = [
    '#93c5fd',
    '#c4b5fd',
    '#fb7185',
    '#fdba74',
    '#86efac',
];

$args = [
    $concurrently,
    '-c',
    implode(',', array_slice($colors, 0, count($commands))),
];

foreach ($commands as $command) {
    $args[] = $command;
}

$args[] = '--names='.implode(',', array_keys($commands));

passthru(implode(' ', array_map('escapeshellarg', $args)), $exitCode);

exit($exitCode);
