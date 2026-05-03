<?php

namespace App\Http\Controllers;

use App\Services\Home\HomePageService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(HomePageService $homePage): Response
    {
        return Inertia::render('index', [
            'home' => $homePage->data(),
        ]);
    }
}
