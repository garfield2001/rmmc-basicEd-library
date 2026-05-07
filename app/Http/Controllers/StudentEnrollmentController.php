<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkAssignStudentEnrollmentRequest;
use App\Http\Requests\PreviewStudentRosterPlacementRequest;
use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Models\StudentEnrollment;
use App\Services\SchoolYears\StudentEnrollmentService;
use App\Support\Academics\AcademicLevels;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentEnrollmentController extends Controller
{
    public function index(Request $request): Response
    {
        $targetSchoolYearId = (int) ($request->integer('target_school_year_id') ?: SchoolYear::active()->value('id'));
        $sourceSchoolYearId = (int) ($request->integer('source_school_year_id') ?: $this->defaultSourceSchoolYearId($targetSchoolYearId));
        $search = $request->string('search')->toString();
        $sourceYearLevel = $request->string('source_year_level')->toString();
        $sourceSection = $request->string('source_section')->toString();
        $sourceMemberStatus = in_array($request->string('source_member_status')->toString(), ['active', 'inactive'], true)
            ? $request->string('source_member_status')->toString()
            : '';
        $sort = in_array($request->string('sort')->toString(), ['name', 'school_id', 'source_year_level', 'source_section', 'target_year_level', 'target_section'], true)
            ? $request->string('sort')->toString()
            : 'name';
        $direction = $request->string('direction')->toString() === 'desc' ? 'desc' : 'asc';
        $perPage = in_array($request->integer('per_page'), [10, 30, 50, 100], true)
            ? $request->integer('per_page')
            : 10;
        $hasDistinctSchoolYears = $sourceSchoolYearId !== $targetSchoolYearId;

        $students = LibraryMember::query()
            ->select('library_members.*')
            ->leftJoin('student_enrollments as source_enrollments', function ($join) use ($sourceSchoolYearId): void {
                $join
                    ->on('source_enrollments.library_member_id', '=', 'library_members.id')
                    ->where('source_enrollments.school_year_id', $sourceSchoolYearId);
            })
            ->leftJoin('student_enrollments as target_enrollments', function ($join) use ($targetSchoolYearId): void {
                $join
                    ->on('target_enrollments.library_member_id', '=', 'library_members.id')
                    ->where('target_enrollments.school_year_id', $targetSchoolYearId);
            })
            ->where('type', LibraryMember::TYPE_STUDENT)
            ->with(['studentEnrollments' => fn ($query) => $query->whereIn('school_year_id', array_unique([$sourceSchoolYearId, $targetSchoolYearId]))])
            ->search($search)
            ->when($sourceMemberStatus, fn (Builder $query) => $query->where('library_members.is_active', $sourceMemberStatus === 'active'))
            ->when(! $hasDistinctSchoolYears, fn (Builder $query) => $query->whereRaw('1 = 0'))
            ->whereHas('studentEnrollments', function (Builder $query) use ($sourceSchoolYearId, $sourceYearLevel, $sourceSection): void {
                $query
                    ->forSchoolYear($sourceSchoolYearId)
                    ->when($sourceYearLevel, fn (Builder $query) => $query->where('year_level', $sourceYearLevel))
                    ->when($sourceSection, fn (Builder $query) => $query->where('section', $sourceSection));
            })
            ->tap(fn (Builder $query) => $this->applySorting($query, $sort, $direction))
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (LibraryMember $member): array => $this->studentEnrollmentRow($member, $sourceSchoolYearId, $targetSchoolYearId));

        return Inertia::render('admin/student-enrollments/index', [
            'students' => $students,
            'schoolYears' => $this->schoolYearOptions(),
            'filters' => [
                'source_school_year_id' => $sourceSchoolYearId,
                'target_school_year_id' => $targetSchoolYearId,
                'search' => $search,
                'source_year_level' => $sourceYearLevel,
                'source_section' => $sourceSection,
                'source_member_status' => $sourceMemberStatus,
                'per_page' => $perPage,
                'sort' => $sort,
                'direction' => $direction,
            ],
            'options' => [
                'yearLevels' => AcademicLevels::options(),
                'sourceSectionsByYearLevel' => $this->sectionsByYearLevel($sourceSchoolYearId),
                'targetSectionsByYearLevel' => $this->sectionsByYearLevel($targetSchoolYearId),
                'hasDistinctSchoolYears' => $hasDistinctSchoolYears,
            ],
        ]);
    }

    public function bulkAssign(BulkAssignStudentEnrollmentRequest $request, StudentEnrollmentService $enrollments): RedirectResponse
    {
        $count = $enrollments->bulkAssign(
            (int) $request->validated('school_year_id'),
            $request->validated('member_ids') ?? [],
            $request->validated('year_level'),
            $request->validated('section') ?? null,
            $request->validated('status') ?? 'pending',
            (bool) $request->validated('select_all', false),
            $request->validated('filters') ?? [],
        );

        return back()->with('success', "{$count} student enrollment records were updated.");
    }

    public function previewRoster(PreviewStudentRosterPlacementRequest $request, StudentEnrollmentService $enrollments): JsonResponse
    {
        return response()->json([
            'preview' => $enrollments->previewRosterPlacement(
                (int) $request->validated('school_year_id'),
                $request->validated('student_ids'),
                $request->validated('year_level'),
                $request->validated('section') ?? null,
                $request->validated('filters') ?? [],
            ),
        ]);
    }

    private function schoolYearOptions(): array
    {
        return SchoolYear::query()
            ->orderByDesc('starts_at')
            ->get(['id', 'name', 'is_active'])
            ->map(fn (SchoolYear $schoolYear): array => [
                'id' => $schoolYear->id,
                'name' => $schoolYear->name,
                'is_active' => $schoolYear->is_active,
            ])
            ->all();
    }

    private function sectionsByYearLevel(int $schoolYearId): array
    {
        return SchoolYearSection::query()
            ->forSchoolYear($schoolYearId)
            ->orderBy('year_level')
            ->orderBy('name')
            ->get(['year_level', 'name'])
            ->groupBy('year_level')
            ->map(fn ($sections) => $sections->pluck('name')->values()->all())
            ->all();
    }

    private function defaultSourceSchoolYearId(int $targetSchoolYearId): int
    {
        return (int) (SchoolYear::query()
            ->whereKeyNot($targetSchoolYearId)
            ->orderByDesc('starts_at')
            ->value('id') ?: $targetSchoolYearId);
    }

    private function studentEnrollmentRow(LibraryMember $member, int $sourceSchoolYearId, int $targetSchoolYearId): array
    {
        $source = $member->studentEnrollments->firstWhere('school_year_id', $sourceSchoolYearId);
        $target = $member->studentEnrollments->firstWhere('school_year_id', $targetSchoolYearId);

        return [
            'id' => $member->id,
            'rfid_uid' => $member->rfid_uid,
            'school_id' => $member->school_id,
            'type' => $member->type,
            'first_name' => $member->first_name,
            'middle_name' => $member->middle_name,
            'last_name' => $member->last_name,
            'name' => $member->full_name,
            'photo' => $member->photo,
            'photo_url' => $member->photo ? asset('member-photos/'.$member->photo) : null,
            'is_active' => $member->is_active,
            'group' => trim(collect([$target?->year_level, $target?->section])->filter()->implode(' - ')) ?: null,
            'student' => $this->enrollmentPayload($target),
            'source_student' => $this->enrollmentPayload($source),
            'target_student' => $this->enrollmentPayload($target),
            'employee' => null,
        ];
    }

    private function applySorting(Builder $query, string $sort, string $direction): void
    {
        match ($sort) {
            'school_id' => $query->orderBy('library_members.school_id', $direction),
            'source_year_level' => $query->orderBy('source_enrollments.year_level', $direction)->orderBy('source_enrollments.section', $direction),
            'source_section' => $query->orderBy('source_enrollments.section', $direction)->orderBy('source_enrollments.year_level', $direction),
            'target_year_level' => $query->orderBy('target_enrollments.year_level', $direction)->orderBy('target_enrollments.section', $direction),
            'target_section' => $query->orderBy('target_enrollments.section', $direction)->orderBy('target_enrollments.year_level', $direction),
            default => $query->orderBy('library_members.last_name', $direction)->orderBy('library_members.first_name', $direction),
        };

        $query->orderBy('library_members.id');
    }

    private function enrollmentPayload(?StudentEnrollment $enrollment): ?array
    {
        if (! $enrollment) {
            return null;
        }

        return [
            'school_year_id' => $enrollment->school_year_id,
            'school_year_section_id' => $enrollment->school_year_section_id,
            'year_level' => $enrollment->year_level,
            'section' => $enrollment->section,
            'status' => $enrollment->status,
        ];
    }
}
