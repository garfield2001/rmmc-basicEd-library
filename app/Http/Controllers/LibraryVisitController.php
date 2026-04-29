<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLibraryVisitRequest;
use App\Services\Library\LibraryVisitService;
use Illuminate\Http\RedirectResponse;

class LibraryVisitController extends Controller
{
    public function store(StoreLibraryVisitRequest $request, LibraryVisitService $libraryVisits): RedirectResponse
    {
        $visit = $libraryVisits->recordFromRfid($request->validated('rfid_uid'));

        return back()->with('success', "{$visit->member->full_name}'s library visit has been recorded.");
    }
}
