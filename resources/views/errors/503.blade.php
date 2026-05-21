@include('errors.layout', [
    'code' => 503,
    'title' => 'Service unavailable',
    'message' => 'The library system is temporarily unavailable, likely because the host computer is restarting or under maintenance.',
])
