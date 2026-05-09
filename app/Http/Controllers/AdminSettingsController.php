<?php

namespace App\Http\Controllers;

use App\Services\Settings\LibraryScanSettingsService;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function __invoke(LibraryScanSettingsService $scanSettings): Response
    {
        return Inertia::render('admin/settings', [
            'scanSettings' => $scanSettings->toPageProps(),
        ]);
    }
}
