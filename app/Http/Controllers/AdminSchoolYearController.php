<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSchoolYearRequest;
use App\Models\SchoolYear;
use App\Services\SchoolYears\SchoolYearService;
use Illuminate\Http\RedirectResponse;

class AdminSchoolYearController extends Controller
{
    public function store(StoreSchoolYearRequest $request, SchoolYearService $schoolYears): RedirectResponse
    {
        $schoolYear = $schoolYears->create($request->validated());

        return redirect()
            ->route('admin.settings')
            ->with('success', "School year {$schoolYear->name} has been created. Existing students were promoted with blank sections.");
    }

    public function activate(SchoolYear $schoolYear, SchoolYearService $schoolYears): RedirectResponse
    {
        $schoolYears->activate($schoolYear);

        return redirect()
            ->route('admin.settings')
            ->with('success', "School year {$schoolYear->name} is now active. Existing students were promoted with blank sections when needed.");
    }
}
