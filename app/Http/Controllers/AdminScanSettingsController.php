<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateLibraryScanSettingsRequest;
use App\Services\Settings\LibraryScanSettingsService;
use Illuminate\Http\RedirectResponse;

class AdminScanSettingsController extends Controller
{
    public function update(UpdateLibraryScanSettingsRequest $request, LibraryScanSettingsService $scanSettings): RedirectResponse
    {
        $scanSettings->update($request->validated());

        return back()->with('success', 'Library scan rules updated.');
    }
}
