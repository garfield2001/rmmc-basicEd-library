<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAdminProfileRequest;
use App\Services\AdminProfileService;
use Illuminate\Http\RedirectResponse;

class AdminProfileController extends Controller
{
    public function update(UpdateAdminProfileRequest $request, AdminProfileService $profiles): RedirectResponse
    {
        $profiles->update($request->user(), $request->validated());

        return back()->with('success', 'Admin settings updated.');
    }
}
