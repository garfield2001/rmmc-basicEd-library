<?php

namespace App\Http\Controllers;

use App\Services\Home\HomePageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request, HomePageService $homePage): Response|RedirectResponse
    {
        if ($request->user()?->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('index', [
            'home' => $homePage->data(),
        ]);
    }
}
