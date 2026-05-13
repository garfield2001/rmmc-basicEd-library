<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkAssignRegisteredVisitorStudentsRequest;
use App\Http\Requests\BulkDestroyArchivedRegisteredVisitorsRequest;
use App\Http\Requests\BulkDestroyRegisteredVisitorsRequest;
use App\Http\Requests\CopyRegisteredVisitorColumnsRequest;
use App\Http\Requests\ImportRegisteredVisitorsRequest;
use App\Http\Requests\PreviewRegisteredVisitorStudentsRequest;
use App\Http\Requests\StoreRegisteredVisitorRequest;
use App\Http\Requests\UpdateRegisteredVisitorRequest;
use App\Http\Resources\RegisteredVisitorResource;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Services\Library\RegisteredVisitorImportService;
use App\Services\Library\RegisteredVisitorService;
use App\Services\Library\RegisteredVisitorTableService;
use App\Services\SchoolYears\SchoolYearSectionService;
use App\Support\Academics\AcademicLevels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredVisitorController extends Controller
{
    public function index(Request $request, RegisteredVisitorTableService $memberTable, SchoolYearSectionService $sections): Response
    {
        $type = $memberTable->typeOption($request->string('type')->toString());
        $search = $request->string('search')->toString();
        $yearLevel = $request->string('year_level')->toString();
        $section = $request->string('section')->toString();
        $department = $request->string('department')->toString();
        $sort = $memberTable->sortOption($request->string('sort')->toString());
        $direction = $memberTable->directionOption($request->string('direction')->toString());
        $perPage = $memberTable->perPageOption($request);
        $activeSchoolYearId = SchoolYear::active()->value('id');

        $membersQuery = $memberTable->filteredQuery($type, $search, $yearLevel, $section, $activeSchoolYearId, $department);

        $allRowsCount = $perPage === 'all'
            ? max((clone $membersQuery)->count('registered_visitors.id'), 1)
            : null;

        $memberTable->applySort($membersQuery, $sort, $direction, $activeSchoolYearId);

        $members = $membersQuery
            ->paginate($perPage === 'all' ? $allRowsCount : $perPage)
            ->withQueryString()
            ->through(fn (RegisteredVisitor $member): array => RegisteredVisitorResource::make($member)->resolve($request));

        return Inertia::render('admin/registered-visitors/index', [
            'members' => $members,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'year_level' => $yearLevel,
                'section' => $section,
                'department' => $department,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'filterOptions' => [
                'yearLevels' => $this->yearLevelOptions(),
                'sectionsByYearLevel' => $sections->groupedByYearLevel($activeSchoolYearId),
                'departments' => $this->departmentOptions(),
            ],
        ]);
    }

    public function archive(Request $request, RegisteredVisitorTableService $memberTable): Response
    {
        $type = $memberTable->typeOption($request->string('type')->toString());
        $search = $request->string('search')->toString();
        $schoolYearId = $request->integer('school_year_id') ?: null;
        $yearLevel = $request->string('year_level')->toString();
        $section = $request->string('section')->toString();
        $department = $request->string('department')->toString();
        $status = in_array($request->string('status')->toString(), ['active', 'inactive'], true)
            ? $request->string('status')->toString()
            : '';

        $members = $this->archivedMembersQuery($type, $search, $schoolYearId, $yearLevel, $section, $department, $status)
            ->orderByDesc('deleted_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (RegisteredVisitor $member): array => RegisteredVisitorResource::make($member)->resolve($request));

        return Inertia::render('admin/registered-visitors/archive', [
            'members' => $members,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'school_year_id' => $schoolYearId,
                'year_level' => $yearLevel,
                'section' => $section,
                'department' => $department,
                'status' => $status,
            ],
            'filterOptions' => [
                'schoolYears' => $this->schoolYearOptions(),
                'yearLevels' => $this->yearLevelOptions(),
                'sectionsByYearLevel' => $this->archivedSectionsByYearLevel($schoolYearId),
                'sectionsBySchoolYear' => $this->archivedSectionsBySchoolYear(),
                'departments' => RegisteredVisitor::onlyTrashed()
                    ->where('type', RegisteredVisitor::TYPE_EMPLOYEE)
                    ->join('employee_profiles', 'employee_profiles.registered_visitor_id', '=', 'registered_visitors.id')
                    ->distinct()
                    ->orderBy('employee_profiles.department')
                    ->pluck('employee_profiles.department')
                    ->filter()
                    ->values(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/registered-visitors/form', [
            'member' => null,
        ]);
    }

    public function store(StoreRegisteredVisitorRequest $request, RegisteredVisitorService $members): RedirectResponse
    {
        $member = $members->create($request->validated());

        return redirect()->route('admin.registered-visitors.index', ['type' => $member->type])->with('success', 'registered visitor has been created.');
    }

    public function previewStudentAssignment(PreviewRegisteredVisitorStudentsRequest $request, RegisteredVisitorService $members): JsonResponse
    {
        return response()->json([
            'preview' => $members->previewStudentAssignment(
                $request->validated('student_ids'),
                $request->validated('section') ?? null,
            ),
        ]);
    }

    public function bulkAssignStudents(BulkAssignRegisteredVisitorStudentsRequest $request, RegisteredVisitorService $members): RedirectResponse
    {
        $count = $members->assignStudents(
            $request->validated('member_ids'),
            $request->validated('section') ?? null,
        );

        return back()->with('success', "{$count} student records were updated.");
    }

    public function import(ImportRegisteredVisitorsRequest $request, RegisteredVisitorImportService $imports): RedirectResponse
    {
        $summary = $imports->import($request->file('members_file'));

        return back()->with(
            'success',
            "Import finished: {$summary['created']} created, {$summary['updated']} updated, {$summary['restored']} restored, {$summary['visits']} visits added, {$summary['skipped']} skipped.",
        );
    }

    public function copyColumns(CopyRegisteredVisitorColumnsRequest $request, RegisteredVisitorTableService $memberTable): JsonResponse
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
            (string) ($validated['department'] ?? ''),
            $memberTable->sortOption((string) ($validated['sort'] ?? '')),
            $memberTable->directionOption((string) ($validated['direction'] ?? 'desc')),
            $activeSchoolYearId,
        );

        return response()->json($copyPayload);
    }

    public function edit(RegisteredVisitor $member): Response
    {
        $activeSchoolYearId = SchoolYear::active()->value('id');

        return Inertia::render('admin/registered-visitors/form', [
            'member' => RegisteredVisitorResource::make($member->load([
                'student' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
                'employee',
            ]))->resolve(request()),
        ]);
    }

    public function update(UpdateRegisteredVisitorRequest $request, RegisteredVisitor $member, RegisteredVisitorService $members): RedirectResponse
    {
        $member = $members->update($member, $request->validated());

        return redirect()->route('admin.registered-visitors.index', ['type' => $member->type])->with('success', 'registered visitor has been updated.');
    }

    public function destroy(RegisteredVisitor $member, RegisteredVisitorService $members): RedirectResponse
    {
        $members->delete($member);

        return redirect()->route('admin.registered-visitors.index')->with('success', 'registered visitor has been moved to archive.');
    }

    public function bulkDestroy(
        BulkDestroyRegisteredVisitorsRequest $request,
        RegisteredVisitorService $members,
        RegisteredVisitorTableService $memberTable,
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
                    (string) ($validated['department'] ?? ''),
                ),
            );
        } else {
            $count = $members->bulkArchive($validated['member_ids']);
        }

        return redirect()
            ->route('admin.registered-visitors.index', ['type' => $type])
            ->with('success', "{$count} Registered Visitors have been moved to archive.");
    }

    public function restoreArchived(int $member, RegisteredVisitorService $members): RedirectResponse
    {
        $restored = $members->restoreArchived($member);

        return redirect()
            ->route('admin.registered-visitors.archive', ['type' => $restored->type])
            ->with('success', "{$restored->full_name} has been restored.");
    }

    public function permanentlyDeleteArchived(int $member, RegisteredVisitorService $members): RedirectResponse
    {
        $members->permanentlyDeleteArchived($member);

        return redirect()
            ->route('admin.registered-visitors.archive')
            ->with('success', 'Archived member has been permanently deleted.');
    }

    public function bulkPermanentlyDeleteArchived(BulkDestroyArchivedRegisteredVisitorsRequest $request, RegisteredVisitorService $members): RedirectResponse
    {
        $validated = $request->validated();
        $count = $members->permanentlyDeleteArchivedMany($validated['member_ids']);

        return redirect()
            ->route('admin.registered-visitors.archive', ['type' => $validated['type']])
            ->with('success', "{$count} archived members have been permanently deleted.");
    }

    public function exportArchived(Request $request, RegisteredVisitorService $members, RegisteredVisitorTableService $memberTable): HttpResponse
    {
        $type = $memberTable->typeOption($request->string('type')->toString());
        $search = $request->string('search')->toString();
        $schoolYearId = $request->integer('school_year_id') ?: null;
        $yearLevel = $request->string('year_level')->toString();
        $section = $request->string('section')->toString();
        $department = $request->string('department')->toString();
        $status = in_array($request->string('status')->toString(), ['active', 'inactive'], true)
            ? $request->string('status')->toString()
            : '';
        $exportedMembers = $this->archivedMembersQuery($type, $search, $schoolYearId, $yearLevel, $section, $department, $status)
            ->with(['visits.schoolYear'])
            ->orderByDesc('deleted_at')
            ->get();

        if ($request->boolean('delete_after_export')) {
            $members->permanentlyDeleteArchivedMany($exportedMembers->pluck('id')->all());
        }

        return response()
            ->view('registered-visitors.archive-export-table', [
                'members' => $exportedMembers,
            ])
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="archived-registered-visitors.xls"');
    }

    /**
     * @return array<int, string>
     */
    private function yearLevelOptions(): array
    {
        return AcademicLevels::options();
    }

    private function schoolYearOptions()
    {
        return SchoolYear::query()
            ->orderByDesc('starts_at')
            ->get(['id', 'name', 'starts_at', 'ends_at', 'is_active'])
            ->map(fn (SchoolYear $schoolYear): array => [
                'id' => $schoolYear->id,
                'name' => $schoolYear->name,
                'starts_at' => $schoolYear->starts_at->toDateString(),
                'ends_at' => $schoolYear->ends_at->toDateString(),
                'is_active' => $schoolYear->is_active,
            ]);
    }

    private function departmentOptions()
    {
        return RegisteredVisitor::query()
            ->where('type', RegisteredVisitor::TYPE_EMPLOYEE)
            ->join('employee_profiles', 'employee_profiles.registered_visitor_id', '=', 'registered_visitors.id')
            ->distinct()
            ->orderBy('employee_profiles.department')
            ->pluck('employee_profiles.department')
            ->filter()
            ->values();
    }

    private function archivedSectionsByYearLevel(?int $schoolYearId = null)
    {
        return StudentSchoolYearRecord::query()
            ->whereHas('member', fn ($query) => $query->onlyTrashed()->where('type', RegisteredVisitor::TYPE_STUDENT))
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId))
            ->whereNotNull('section')
            ->orderBy('year_level')
            ->orderBy('section')
            ->get(['year_level', 'section'])
            ->groupBy('year_level')
            ->map(fn ($sections) => $sections->pluck('section')->filter()->unique()->values())
            ->toArray();
    }

    private function archivedSectionsBySchoolYear(): array
    {
        return StudentSchoolYearRecord::query()
            ->whereHas('member', fn ($query) => $query->onlyTrashed()->where('type', RegisteredVisitor::TYPE_STUDENT))
            ->whereNotNull('section')
            ->orderBy('school_year_id')
            ->orderBy('year_level')
            ->orderBy('section')
            ->get(['school_year_id', 'year_level', 'section'])
            ->groupBy('school_year_id')
            ->map(fn ($schoolYearSections) => $schoolYearSections
                ->groupBy('year_level')
                ->map(fn ($sections) => $sections->pluck('section')->filter()->unique()->values()->all())
                ->all())
            ->all();
    }

    private function archivedMembersQuery(
        string $type,
        string $search,
        ?int $schoolYearId = null,
        string $yearLevel = '',
        string $section = '',
        string $department = '',
        string $status = '',
    ) {
        return RegisteredVisitor::onlyTrashed()
            ->with([
                'student' => fn ($query) => $query->when($schoolYearId, fn ($query) => $query->forSchoolYear($schoolYearId)),
                'employee',
            ])
            ->ofType($type)
            ->search($search)
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when($type === RegisteredVisitor::TYPE_STUDENT, function ($query) use ($schoolYearId, $yearLevel, $section): void {
                $query->whereHas('studentSchoolYearRecords', function ($query) use ($schoolYearId, $yearLevel, $section): void {
                    $query
                        ->when($schoolYearId, fn ($query) => $query->forSchoolYear($schoolYearId))
                        ->when($yearLevel, fn ($query) => $query->where('year_level', $yearLevel))
                        ->when($section, fn ($query) => $query->where('section', $section));
                });
            })
            ->when($type === RegisteredVisitor::TYPE_EMPLOYEE && $department, function ($query) use ($department): void {
                $query->whereHas('employee', fn ($query) => $query->where('department', $department));
            })
            ->select('registered_visitors.*');
    }
}
