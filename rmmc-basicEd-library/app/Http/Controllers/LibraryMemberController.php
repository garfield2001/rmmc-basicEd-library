<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLibraryMemberRequest;
use App\Http\Requests\UpdateLibraryMemberRequest;
use App\Http\Resources\LibraryMemberResource;
use App\Models\LibraryMember;
use App\Services\Library\LibraryMemberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LibraryMemberController extends Controller
{
    public function index(Request $request): Response
    {
        $requestedType = $request->string('type')->toString();
        $type = in_array($requestedType, [LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE], true)
            ? $requestedType
            : LibraryMember::TYPE_STUDENT;
        $search = $request->string('search')->toString();

        $members = LibraryMember::query()
            ->with(['student', 'employee'])
            ->ofType($type)
            ->search($search)
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (LibraryMember $member): array => LibraryMemberResource::make($member)->resolve($request));

        return Inertia::render('admin/members/index', [
            'members' => $members,
            'filters' => [
                'search' => $search,
                'type' => $type,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/members/form', [
            'member' => null,
        ]);
    }

    public function store(StoreLibraryMemberRequest $request, LibraryMemberService $members): RedirectResponse
    {
        $member = $members->create($request->validated());

        return redirect()->route('admin.members.index', ['type' => $member->type])->with('success', 'Library member has been created.');
    }

    public function edit(LibraryMember $member): Response
    {
        return Inertia::render('admin/members/form', [
            'member' => LibraryMemberResource::make($member->load(['student', 'employee']))->resolve(request()),
        ]);
    }

    public function update(UpdateLibraryMemberRequest $request, LibraryMember $member, LibraryMemberService $members): RedirectResponse
    {
        $member = $members->update($member, $request->validated());

        return redirect()->route('admin.members.index', ['type' => $member->type])->with('success', 'Library member has been updated.');
    }

    public function destroy(LibraryMember $member, LibraryMemberService $members): RedirectResponse
    {
        $members->delete($member);

        return redirect()->route('admin.members.index')->with('success', 'Library member has been deleted.');
    }
}
