<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLibraryVisitRequest;
use App\Services\Library\LibraryVisitService;
use Illuminate\Http\RedirectResponse;

class LibraryVisitController extends Controller
{
    public function store(StoreLibraryVisitRequest $request, LibraryVisitService $libraryVisits): RedirectResponse
    {
        $visit = $libraryVisits->recordFromRFID($request->validated('rfid_uid'));
        $visit->load([
            'visitor.student' => fn ($query) => $query->forSchoolYear($visit->school_year_id),
            'visitor.employee',
        ]);

        return back()->with('recentVisit', [
            'id' => $visit->id,
            'visitedAt' => $visit->visited_at?->toIso8601String(),
            'visitor' => [
                'schoolId' => $visit->visitor?->school_id,
                'name' => $visit->visitor?->full_name,
                'type' => $visit->visitor?->type,
                'yearLevel' => $visit->visitor?->student?->year_level,
                'section' => $visit->visitor?->student?->section,
                'department' => $visit->visitor?->employee?->department,
                'photoUrl' => $visit->visitor?->photo ? asset('visitor-photos/'.$visit->visitor->photo) : null,
            ],
        ]);
    }
}
