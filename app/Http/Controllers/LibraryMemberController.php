<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportLibraryMembersRequest;
use App\Http\Requests\StoreLibraryMemberRequest;
use App\Http\Requests\UpdateLibraryMemberRequest;
use App\Http\Resources\LibraryMemberResource;
use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Services\Library\LibraryMemberImportService;
use App\Services\Library\LibraryMemberService;
use App\Services\Library\LibraryMemberTableService;
use App\Services\SchoolYears\SchoolYearSectionService;
use App\Support\Academics\AcademicLevels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LibraryMemberController extends Controller
{
    public function index(Request $request, LibraryMemberTableService $visitorTable, SchoolYearSectionService $sections, ?string $audience = null): Response
    {
        $type = $this->visitorType($audience, $request->string('type')->toString(), $visitorTable);
        $search = $request->string('search')->toString();
        $yearLevel = $request->string('year_level')->toString();
        $section = $request->string('section')->toString();
        $department = $request->string('department')->toString();
        $sort = $visitorTable->sortOption($request->string('sort')->toString(), $type);
        $direction = $visitorTable->directionOption($request->string('direction')->toString());
        $perPage = $visitorTable->perPageOption($request);
        $activeSchoolYearId = SchoolYear::active()->value('id');

        $visitorsQuery = $visitorTable->filteredQuery($type, $search, $yearLevel, $section, $activeSchoolYearId, $department);

        $allRowsCount = $perPage === 'all'
            ? max((clone $visitorsQuery)->count('library_members.id'), 1)
            : null;

        $visitorTable->applySort($visitorsQuery, $sort, $direction, $activeSchoolYearId);

        $visitors = $visitorsQuery
            ->paginate($perPage === 'all' ? $allRowsCount : $perPage)
            ->withQueryString()
            ->through(fn (LibraryMember $visitor): array => LibraryMemberResource::make($visitor)->resolve($request));

        return Inertia::render('admin/registered-visitors/index', [
            'visitors' => $visitors,
            'audienceType' => $type,
            'pagePath' => route('admin.registered-visitors.audience', ['audience' => $this->audienceSlug($type)], false),
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
                'departments' => $this->departmentOptions($activeSchoolYearId),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/registered-visitors/form', [
            'visitor' => null,
        ]);
    }

    public function store(StoreLibraryMemberRequest $request, LibraryMemberService $visitors): RedirectResponse
    {
        $visitor = $visitors->create($request->validated());

        return redirect()
            ->route('admin.registered-visitors.audience', ['audience' => $this->audienceSlug($visitor->type)])
            ->with('success', 'registered visitor has been created.');
    }

    public function import(ImportLibraryMembersRequest $request, LibraryMemberImportService $imports): RedirectResponse
    {
        $imports->import($request->file('visitors_file'));

        return back()->with('success', 'Import successful.');
    }

    public function importPreview(ImportLibraryMembersRequest $request, LibraryMemberImportService $imports): JsonResponse
    {
        return response()->json([
            'preview' => $imports->preview($request->file('visitors_file')),
        ]);
    }

    public function edit(LibraryMember $registeredVisitor): Response
    {
        $activeSchoolYearId = SchoolYear::active()->value('id');

        return Inertia::render('admin/registered-visitors/form', [
            'visitor' => LibraryMemberResource::make($registeredVisitor->load([
                'student' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
                'employee',
            ]))->resolve(request()),
        ]);
    }

    public function update(UpdateLibraryMemberRequest $request, LibraryMember $registeredVisitor, LibraryMemberService $visitors): RedirectResponse
    {
        $visitor = $visitors->update($registeredVisitor, $request->validated());

        return redirect()
            ->route('admin.registered-visitors.audience', ['audience' => $this->audienceSlug($visitor->type)])
            ->with('success', 'registered visitor has been updated.');
    }

    /**
     * @return array<int, string>
     */
    private function yearLevelOptions(): array
    {
        return AcademicLevels::options();
    }

    private function departmentOptions(?int $schoolYearId)
    {
        return EmployeeSchoolYearRecord::query()
            ->forRequiredSchoolYear($schoolYearId)
            ->distinct()
            ->orderBy('department')
            ->pluck('department')
            ->filter()
            ->values();
    }

    private function visitorType(?string $audience, string $fallback, LibraryMemberTableService $visitorTable): string
    {
        return match ($audience) {
            'employees' => LibraryMember::TYPE_EMPLOYEE,
            'students' => LibraryMember::TYPE_STUDENT,
            default => $visitorTable->typeOption($fallback),
        };
    }

    private function audienceSlug(string $type): string
    {
        return $type === LibraryMember::TYPE_EMPLOYEE ? 'employees' : 'students';
    }
}
