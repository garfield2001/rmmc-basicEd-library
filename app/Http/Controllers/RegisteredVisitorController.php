<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportRegisteredVisitorsRequest;
use App\Http\Requests\StoreRegisteredVisitorRequest;
use App\Http\Requests\UpdateRegisteredVisitorRequest;
use App\Http\Resources\RegisteredVisitorResource;
use App\Models\EmployeeProfile;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Services\Library\RegisteredVisitorImportService;
use App\Services\Library\RegisteredVisitorService;
use App\Services\Library\RegisteredVisitorTableService;
use App\Services\SchoolYears\SchoolYearSectionService;
use App\Support\Academics\AcademicLevels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredVisitorController extends Controller
{
    public function index(Request $request, RegisteredVisitorTableService $visitorTable, SchoolYearSectionService $sections): Response
    {
        $type = $visitorTable->typeOption($request->string('type')->toString());
        $search = $request->string('search')->toString();
        $yearLevel = $request->string('year_level')->toString();
        $section = $request->string('section')->toString();
        $department = $request->string('department')->toString();
        $sort = $visitorTable->sortOption($request->string('sort')->toString());
        $direction = $visitorTable->directionOption($request->string('direction')->toString());
        $perPage = $visitorTable->perPageOption($request);
        $activeSchoolYearId = SchoolYear::active()->value('id');

        $visitorsQuery = $visitorTable->filteredQuery($type, $search, $yearLevel, $section, $activeSchoolYearId, $department);

        $allRowsCount = $perPage === 'all'
            ? max((clone $visitorsQuery)->count('registered_visitors.id'), 1)
            : null;

        $visitorTable->applySort($visitorsQuery, $sort, $direction, $activeSchoolYearId);

        $visitors = $visitorsQuery
            ->paginate($perPage === 'all' ? $allRowsCount : $perPage)
            ->withQueryString()
            ->through(fn (RegisteredVisitor $visitor): array => RegisteredVisitorResource::make($visitor)->resolve($request));

        return Inertia::render('admin/registered-visitors/index', [
            'visitors' => $visitors,
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

    public function store(StoreRegisteredVisitorRequest $request, RegisteredVisitorService $visitors): RedirectResponse
    {
        $visitor = $visitors->create($request->validated());

        return redirect()->route('admin.registered-visitors.index', ['type' => $visitor->type])->with('success', 'registered visitor has been created.');
    }

    public function import(ImportRegisteredVisitorsRequest $request, RegisteredVisitorImportService $imports): RedirectResponse
    {
        $imports->import($request->file('visitors_file'));

        return back()->with('success', 'Import successful.');
    }

    public function importPreview(ImportRegisteredVisitorsRequest $request, RegisteredVisitorImportService $imports): JsonResponse
    {
        return response()->json([
            'preview' => $imports->preview($request->file('visitors_file')),
        ]);
    }

    public function edit(RegisteredVisitor $registeredVisitor): Response
    {
        $activeSchoolYearId = SchoolYear::active()->value('id');

        return Inertia::render('admin/registered-visitors/form', [
            'visitor' => RegisteredVisitorResource::make($registeredVisitor->load([
                'student' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
                'employee',
            ]))->resolve(request()),
        ]);
    }

    public function update(UpdateRegisteredVisitorRequest $request, RegisteredVisitor $registeredVisitor, RegisteredVisitorService $visitors): RedirectResponse
    {
        $visitor = $visitors->update($registeredVisitor, $request->validated());

        return redirect()->route('admin.registered-visitors.index', ['type' => $visitor->type])->with('success', 'registered visitor has been updated.');
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
        return EmployeeProfile::query()
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0'))
            ->distinct()
            ->orderBy('department')
            ->pluck('department')
            ->filter()
            ->values();
    }
}
