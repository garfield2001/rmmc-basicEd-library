<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkAssignLibraryMemberStudentsRequest;
use App\Http\Requests\BulkDestroyArchivedLibraryMembersRequest;
use App\Http\Requests\BulkDestroyLibraryMembersRequest;
use App\Http\Requests\CopyLibraryMemberColumnsRequest;
use App\Http\Requests\PreviewLibraryMemberStudentsRequest;
use App\Http\Requests\StoreLibraryMemberRequest;
use App\Http\Requests\UpdateLibraryMemberRequest;
use App\Http\Resources\LibraryMemberResource;
use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Services\Library\LibraryMemberService;
use App\Services\Library\LibraryMemberTableService;
use App\Services\SchoolYears\SchoolYearSectionService;
use App\Support\Academics\AcademicLevels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class LibraryMemberController extends Controller
{
    public function index(Request $request, LibraryMemberTableService $memberTable, SchoolYearSectionService $sections): Response
    {
        $type = $memberTable->typeOption($request->string('type')->toString());
        $search = $request->string('search')->toString();
        $yearLevel = $request->string('year_level')->toString();
        $section = $request->string('section')->toString();
        $sort = $memberTable->sortOption($request->string('sort')->toString());
        $direction = $memberTable->directionOption($request->string('direction')->toString());
        $perPage = $memberTable->perPageOption($request);
        $activeSchoolYearId = SchoolYear::active()->value('id');

        $membersQuery = $memberTable->filteredQuery($type, $search, $yearLevel, $section, $activeSchoolYearId);

        $allRowsCount = $perPage === 'all'
            ? max((clone $membersQuery)->count('library_members.id'), 1)
            : null;

        $memberTable->applySort($membersQuery, $sort, $direction, $activeSchoolYearId);

        $members = $membersQuery
            ->paginate($perPage === 'all' ? $allRowsCount : $perPage)
            ->withQueryString()
            ->through(fn (LibraryMember $member): array => LibraryMemberResource::make($member)->resolve($request));

        return Inertia::render('admin/members/index', [
            'members' => $members,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'year_level' => $yearLevel,
                'section' => $section,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'filterOptions' => [
                'yearLevels' => $this->yearLevelOptions(),
                'sectionsByYearLevel' => $sections->groupedByYearLevel($activeSchoolYearId),
            ],
        ]);
    }

    public function archive(Request $request, LibraryMemberTableService $memberTable, SchoolYearSectionService $sections): Response
    {
        $type = $memberTable->typeOption($request->string('type')->toString());
        $search = $request->string('search')->toString();
        $yearLevel = $request->string('year_level')->toString();
        $section = $request->string('section')->toString();
        $department = $request->string('department')->toString();
        $status = in_array($request->string('status')->toString(), ['active', 'inactive'], true)
            ? $request->string('status')->toString()
            : '';
        $activeSchoolYearId = SchoolYear::active()->value('id');

        $members = $this->archivedMembersQuery($type, $search, $activeSchoolYearId, $yearLevel, $section, $department, $status)
            ->orderByDesc('deleted_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (LibraryMember $member): array => LibraryMemberResource::make($member)->resolve($request));

        return Inertia::render('admin/members/archive', [
            'members' => $members,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'year_level' => $yearLevel,
                'section' => $section,
                'department' => $department,
                'status' => $status,
            ],
            'filterOptions' => [
                'yearLevels' => $this->yearLevelOptions(),
                'sectionsByYearLevel' => $sections->groupedByYearLevel($activeSchoolYearId),
                'departments' => LibraryMember::onlyTrashed()
                    ->where('type', LibraryMember::TYPE_EMPLOYEE)
                    ->join('employees', 'employees.library_member_id', '=', 'library_members.id')
                    ->distinct()
                    ->orderBy('employees.department')
                    ->pluck('employees.department')
                    ->filter()
                    ->values(),
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

    public function previewStudentAssignment(PreviewLibraryMemberStudentsRequest $request, LibraryMemberService $members): JsonResponse
    {
        return response()->json([
            'preview' => $members->previewStudentAssignment(
                $request->validated('student_ids'),
                $request->validated('section') ?? null,
            ),
        ]);
    }

    public function bulkAssignStudents(BulkAssignLibraryMemberStudentsRequest $request, LibraryMemberService $members): RedirectResponse
    {
        $count = $members->assignStudents(
            $request->validated('member_ids'),
            $request->validated('section') ?? null,
        );

        return back()->with('success', "{$count} student records were updated.");
    }

    public function copyColumns(CopyLibraryMemberColumnsRequest $request, LibraryMemberTableService $memberTable): JsonResponse
    {
        $validated = $request->validated();
        $type = $validated['type'];
        $activeSchoolYearId = SchoolYear::active()->value('id');
        $copyPayload = $memberTable->copyColumns(
            $request->uniqueColumns(),
            $type,
            (string) ($validated['search'] ?? ''),
            (string) ($validated['year_level'] ?? ''),
            (string) ($validated['section'] ?? ''),
            $memberTable->sortOption((string) ($validated['sort'] ?? '')),
            $memberTable->directionOption((string) ($validated['direction'] ?? 'desc')),
            $activeSchoolYearId,
        );

        return response()->json($copyPayload);
    }

    public function edit(LibraryMember $member): Response
    {
        $activeSchoolYearId = SchoolYear::active()->value('id');

        return Inertia::render('admin/members/form', [
            'member' => LibraryMemberResource::make($member->load([
                'student' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
                'employee',
            ]))->resolve(request()),
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

        return redirect()->route('admin.members.index')->with('success', 'Library member has been moved to archive.');
    }

    public function bulkDestroy(
        BulkDestroyLibraryMembersRequest $request,
        LibraryMemberService $members,
        LibraryMemberTableService $memberTable,
    ): RedirectResponse {
        $validated = $request->validated();
        $type = $memberTable->typeOption($validated['type']);

        if ($request->boolean('select_all')) {
            $activeSchoolYearId = SchoolYear::active()->value('id');
            $count = $members->archiveMatching(
                $memberTable->filteredQuery(
                    $type,
                    (string) ($validated['search'] ?? ''),
                    (string) ($validated['year_level'] ?? ''),
                    (string) ($validated['section'] ?? ''),
                    $activeSchoolYearId,
                ),
            );
        } else {
            $count = $members->bulkArchive($validated['member_ids']);
        }

        return redirect()
            ->route('admin.members.index', ['type' => $type])
            ->with('success', "{$count} library members have been moved to archive.");
    }

    public function restoreArchived(int $member, LibraryMemberService $members): RedirectResponse
    {
        $restored = $members->restoreArchived($member);

        return redirect()
            ->route('admin.members.archive', ['type' => $restored->type])
            ->with('success', "{$restored->full_name} has been restored.");
    }

    public function permanentlyDeleteArchived(int $member, LibraryMemberService $members): RedirectResponse
    {
        $members->permanentlyDeleteArchived($member);

        return redirect()
            ->route('admin.members.archive')
            ->with('success', 'Archived member has been permanently deleted.');
    }

    public function bulkPermanentlyDeleteArchived(BulkDestroyArchivedLibraryMembersRequest $request, LibraryMemberService $members): RedirectResponse
    {
        $validated = $request->validated();
        $count = $members->permanentlyDeleteArchivedMany($validated['member_ids']);

        return redirect()
            ->route('admin.members.archive', ['type' => $validated['type']])
            ->with('success', "{$count} archived members have been permanently deleted.");
    }

    public function exportArchived(Request $request, LibraryMemberService $members, LibraryMemberTableService $memberTable): HttpResponse
    {
        $type = $memberTable->typeOption($request->string('type')->toString());
        $search = $request->string('search')->toString();
        $yearLevel = $request->string('year_level')->toString();
        $section = $request->string('section')->toString();
        $department = $request->string('department')->toString();
        $status = in_array($request->string('status')->toString(), ['active', 'inactive'], true)
            ? $request->string('status')->toString()
            : '';
        $activeSchoolYearId = SchoolYear::active()->value('id');
        $exportedMembers = $this->archivedMembersQuery($type, $search, $activeSchoolYearId, $yearLevel, $section, $department, $status)
            ->with(['visits.schoolYear'])
            ->orderByDesc('deleted_at')
            ->get();

        if ($request->boolean('delete_after_export')) {
            $members->permanentlyDeleteArchivedMany($exportedMembers->pluck('id')->all());
        }

        return response()
            ->view('members.archive-export-table', [
                'members' => $exportedMembers,
            ])
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="archived-library-members.xls"');
    }

    /**
     * @return array<int, string>
     */
    private function yearLevelOptions(): array
    {
        return AcademicLevels::options();
    }

    private function archivedMembersQuery(
        string $type,
        string $search,
        ?int $activeSchoolYearId,
        string $yearLevel = '',
        string $section = '',
        string $department = '',
        string $status = '',
    ) {
        return LibraryMember::onlyTrashed()
            ->with([
                'student' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
                'employee',
            ])
            ->ofType($type)
            ->search($search)
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when($type === LibraryMember::TYPE_STUDENT && $activeSchoolYearId, function ($query) use ($activeSchoolYearId, $yearLevel, $section): void {
                $query->whereHas('studentEnrollments', function ($query) use ($activeSchoolYearId, $yearLevel, $section): void {
                    $query
                        ->forSchoolYear($activeSchoolYearId)
                        ->when($yearLevel, fn ($query) => $query->where('year_level', $yearLevel))
                        ->when($section, fn ($query) => $query->where('section', $section));
                });
            })
            ->when($type === LibraryMember::TYPE_EMPLOYEE && $department, function ($query) use ($department): void {
                $query->whereHas('employee', fn ($query) => $query->where('department', $department));
            })
            ->select('library_members.*');
    }
}
