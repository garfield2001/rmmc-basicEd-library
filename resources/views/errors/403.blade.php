@include('errors.layout', [
    'code' => 403,
    'title' => 'Access denied',
    'message' => 'This account does not have permission to open that part of the library system.',
])
