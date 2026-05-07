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
            'member.student' => fn ($query) => $query->forSchoolYear($visit->school_year_id),
            'member.employee',
        ]);

        return back()->with('recentVisit', [
            'id' => $visit->id,
            'visitedAt' => $visit->visited_at?->toIso8601String(),
            'member' => [
                'schoolId' => $visit->member?->school_id,
                'name' => $visit->member?->full_name,
                'type' => $visit->member?->type,
                'yearLevel' => $visit->member?->student?->year_level,
                'section' => $visit->member?->student?->section,
                'department' => $visit->member?->employee?->department,
                'photoUrl' => $visit->member?->photo ? asset('member-photos/'.$visit->member->photo) : null,
            ],
        ]);
    }
}
