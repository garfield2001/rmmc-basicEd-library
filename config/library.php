<?php

return [
    'scan' => [
        'repeat_scan_interval_hours' => (int) env('LIBRARY_REPEAT_SCAN_INTERVAL_HOURS', 1),
        'starts_at' => env('LIBRARY_SCAN_STARTS_AT', '00:00'),
        'ends_at' => env('LIBRARY_SCAN_ENDS_AT', '23:59'),
    ],
];
