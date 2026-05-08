<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkAssignLibraryMemberStudentsRequest;
use App\Http\Requests\BulkDestroyLibraryMembersRequest;
use App\Http\Requests\PreviewLibraryMemberStudentsRequest;
use App\Http\Requests\StoreLibraryMemberRequest;
use App\Http\Requests\UpdateLibraryMemberRequest;
use App\Http\Resources\LibraryMemberResource;
use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Services\Library\LibraryMemberService;
use App\Services\Library\LibraryMemberTableService;
use App\Support\Academics\AcademicLevels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LibraryMemberController extends Controller
{
    public function index(Request $request, LibraryMemberTableService $memberTable): Response
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
                'sectionsByYearLevel' => $this->sectionsByYearLevel($activeSchoolYearId),
            ],
        ]);
    }

    public function archive(Request $request): Response
    {
        $type = in_array($request->string('type')->toString(), [LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE], true)
            ? $request->string('type')->toString()
            : LibraryMember::TYPE_STUDENT;
        $search = $request->string('search')->toString();
        $activeSchoolYearId = SchoolYear::active()->value('id');

        $members = $this->archivedMembersQuery($type, $search, $activeSchoolYearId)
            ->orderByDesc('deleted_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (LibraryMember $member): array => LibraryMemberResource::make($member)->resolve($request));

        return Inertia::render('admin/members/archive', [
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

    public function copyColumns(Request $request, LibraryMemberTableService $memberTable): JsonResponse
    {
        $validated = $request->validate([
            'columns' => ['required', 'array', 'min:1'],
            'columns.*' => ['string', Rule::in(LibraryMemberTableService::COPY_COLUMNS)],
            'type' => ['required', Rule::in([LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE])],
            'search' => ['nullable', 'string', 'max:255'],
            'year_level' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'max:255'],
            'direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $type = $validated['type'];
        $columns = collect($validated['columns'])
            ->unique()
            ->values()
            ->all();
        $activeSchoolYearId = SchoolYear::active()->value('id');
        $copyPayload = $memberTable->copyColumns(
            $columns,
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

    public function exportArchived(Request $request): HttpResponse
    {
        $type = in_array($request->string('type')->toString(), [LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE], true)
            ? $request->string('type')->toString()
            : LibraryMember::TYPE_STUDENT;
        $search = $request->string('search')->toString();
        $activeSchoolYearId = SchoolYear::active()->value('id');

        return response()
            ->view('members.archive-export-table', [
                'members' => $this->archivedMembersQuery($type, $search, $activeSchoolYearId)
                    ->with(['visits.schoolYear'])
                    ->orderByDesc('deleted_at')
                    ->get(),
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

    /**
     * @return array<int, string>
     */
    private function sectionsByYearLevel(?int $schoolYearId): array
    {
        if (! $schoolYearId) {
            return [];
        }

        return SchoolYearSection::query()
            ->forSchoolYear($schoolYearId)
            ->select('year_level', 'name')
            ->orderBy('year_level')
            ->orderBy('name')
            ->get()
            ->groupBy('year_level')
            ->map(fn ($enrollments) => $enrollments
                ->pluck('name')
                ->filter()
                ->unique()
                ->values()
                ->all())
            ->all();
    }

    private function archivedMembersQuery(string $type, string $search, ?int $activeSchoolYearId)
    {
        return LibraryMember::onlyTrashed()
            ->with([
                'student' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
                'employee',
            ])
            ->ofType($type)
            ->search($search)
            ->select('library_members.*');
    }
}
