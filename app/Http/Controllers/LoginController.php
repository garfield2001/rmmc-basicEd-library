<?php

namespace App\Http\Controllers;

use App\Events\UserSessionReplaced;
use App\Http\Requests\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LoginController extends Controller
{
    public function show(): RedirectResponse
    {
        return redirect('/?login=1');
    }

    public function store(LoginRequest $request): RedirectResponse|JsonResponse
    {
        $request->authenticate();
        $request->session()->regenerate();
        Auth::logoutOtherDevices($request->string('password')->toString());

        try {
            broadcast(new UserSessionReplaced($request->user(), $request->session()->getId()));
        } catch (\Throwable $exception) {
            Log::warning('Admin session replacement was not broadcast.', [
                'user_id' => $request->user()?->id,
                'message' => $exception->getMessage(),
            ]);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'redirect' => route('admin.dashboard'),
            ]);
        }

        return redirect()->intended(route('admin.dashboard'))->with('success', 'Admin session started.');
    }

    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'authenticated' => $request->user() !== null,
            'sessionId' => $request->session()->getId(),
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')->with('success', 'You have been logged out.');
    }

    public function destroyOnClose(Request $request): HttpResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
