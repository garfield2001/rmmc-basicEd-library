<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Security headers
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Content Security Policy (CSP) - Start with report-only mode for testing
        // In production, switch to 'Content-Security-Policy' to enforce the policy
        $cspPolicy = "default-src 'self'; "
                   . "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                   . "style-src 'self' 'unsafe-inline'; "
                   . "img-src 'self' data: blob:; "
                   . "font-src 'self'; "
                   . "connect-src 'self' https://*.pusher.com wss://*.pusher.com; "
                   . "frame-ancestors 'self'; "
                   . "base-uri 'self'; "
                   . "form-action 'self';";

        // Use report-only mode initially to identify any blocked resources without breaking functionality
        $response->headers->set('Content-Security-Policy-Report-Only', $cspPolicy);

        // Remove powered-by headers that might leak information
        $response->headers->remove('X-Powered-By');

        return $response;
    }
}