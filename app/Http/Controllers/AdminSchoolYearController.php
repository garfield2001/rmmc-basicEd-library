<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSchoolYearRequest;
use App\Http\Requests\UpdateSchoolYearRequest;
use App\Models\SchoolYear;
use App\Services\SchoolYears\SchoolYearService;
use Illuminate\Http\RedirectResponse;

class AdminSchoolYearController extends Controller
{
    public function store(StoreSchoolYearRequest $request, SchoolYearService $schoolYears): RedirectResponse
    {
        $schoolYear = $schoolYears->create($request->validated());

        return back()->with('success', "Transitioned to school year {$schoolYear->name}. The new school year is ready for fresh imports.");
    }

    public function activate(SchoolYear $schoolYear, SchoolYearService $schoolYears): RedirectResponse
    {
        $schoolYears->activate($schoolYear);

        return back()->with('success', "School year {$schoolYear->name} is now active.");
    }

    public function update(UpdateSchoolYearRequest $request, SchoolYear $schoolYear, SchoolYearService $schoolYears): RedirectResponse
    {
        $schoolYear = $schoolYears->update($schoolYear, $request->validated());

        return back()->with('success', "School year {$schoolYear->name} has been updated.");
    }
}
