@include('errors.layout', [
    'code' => 500,
    'title' => 'Something went wrong',
    'message' => 'The library system could not complete the request. Please try again, then contact the administrator if it continues.',
])
