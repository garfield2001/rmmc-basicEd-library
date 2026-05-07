<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkAssignLibraryMemberStudentsRequest;
use App\Http\Requests\PreviewLibraryMemberStudentsRequest;
use App\Http\Requests\StoreLibraryMemberRequest;
use App\Http\Requests\UpdateLibraryMemberRequest;
use App\Http\Resources\LibraryMemberResource;
use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Services\Library\LibraryMemberService;
use App\Support\Academics\AcademicLevels;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
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
        $yearLevel = $request->string('year_level')->toString();
        $section = $request->string('section')->toString();
        $perPage = in_array($request->integer('per_page'), [10, 30, 50, 100], true)
            ? $request->integer('per_page')
            : 10;
        $activeSchoolYearId = SchoolYear::active()->value('id');

        $members = LibraryMember::query()
            ->with([
                'student' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
                'employee',
            ])
            ->ofType($type)
            ->search($search)
            ->when($type === LibraryMember::TYPE_STUDENT, function (Builder $query) use ($activeSchoolYearId, $yearLevel, $section): void {
                if (! $activeSchoolYearId) {
                    $query->whereRaw('1 = 0');

                    return;
                }

                $query->whereHas('studentEnrollments', function (Builder $query) use ($activeSchoolYearId, $yearLevel, $section): void {
                    $query
                        ->forSchoolYear($activeSchoolYearId)
                        ->when($yearLevel, fn (Builder $query) => $query->where('year_level', $yearLevel))
                        ->when($section, fn (Builder $query) => $query->where('section', $section));
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (LibraryMember $member): array => LibraryMemberResource::make($member)->resolve($request));

        return Inertia::render('admin/members/index', [
            'members' => $members,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'year_level' => $yearLevel,
                'section' => $section,
                'per_page' => $perPage,
            ],
            'filterOptions' => [
                'yearLevels' => $this->yearLevelOptions(),
                'sectionsByYearLevel' => $this->sectionsByYearLevel($activeSchoolYearId),
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
                $request->validated('year_level'),
                $request->validated('section') ?? null,
            ),
        ]);
    }

    public function bulkAssignStudents(BulkAssignLibraryMemberStudentsRequest $request, LibraryMemberService $members): RedirectResponse
    {
        $count = $members->assignStudents(
            $request->validated('member_ids'),
            $request->validated('year_level'),
            $request->validated('section') ?? null,
        );

        return back()->with('success', "{$count} student records were updated.");
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

        return redirect()->route('admin.members.index')->with('success', 'Library member has been deleted.');
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
}
