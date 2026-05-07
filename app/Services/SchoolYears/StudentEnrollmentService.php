<?php

namespace App\Services\SchoolYears;

use App\Models\LibraryMember;
use App\Models\StudentEnrollment;
use App\Support\Academics\AcademicLevels;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudentEnrollmentService
{
    public function __construct(private readonly SchoolYearSectionService $sections) {}

    /**
     * @param  array<int, int>  $memberIds
     */
    public function bulkAssign(int $schoolYearId, array $memberIds, string $yearLevel, ?string $sectionName, string $status, bool $selectAll = false, array $filters = []): int
    {
        $sectionName = trim((string) $sectionName);
        $section = $sectionName !== ''
            ? $this->sections->findOrCreate($schoolYearId, $yearLevel, $sectionName)
            : null;

        return DB::transaction(function () use ($schoolYearId, $memberIds, $yearLevel, $section, $status, $selectAll, $filters): int {
            $students = $this->studentIdsForAction($schoolYearId, $memberIds, $selectAll, $filters);
            $this->ensureNoDemotions($students->all(), $yearLevel, $filters);

            $students->each(function (int $memberId) use ($schoolYearId, $yearLevel, $section, $status): void {
                StudentEnrollment::query()->updateOrCreate(
                    [
                        'library_member_id' => $memberId,
                        'school_year_id' => $schoolYearId,
                    ],
                    [
                        'school_year_section_id' => $section?->id,
                        'year_level' => $yearLevel,
                        'section' => $section?->name,
                        'status' => $status,
                    ],
                );
            });

            return $students->count();
        });
    }

    /**
     * @param  array<int, int>  $memberIds
     * @param  array<string, mixed>  $filters
     * @return \Illuminate\Support\Collection<int, int>
     */
    private function studentIdsForAction(int $schoolYearId, array $memberIds, bool $selectAll, array $filters)
    {
        if (! $selectAll) {
            return LibraryMember::query()
                ->whereKey($memberIds)
                ->where('type', LibraryMember::TYPE_STUDENT)
                ->pluck('id');
        }

        return LibraryMember::query()
            ->where('type', LibraryMember::TYPE_STUDENT)
            ->search($filters['search'] ?? null)
            ->when($filters['source_member_status'] ?? null, fn (Builder $query, string $status) => $query->where('is_active', $status === 'active'))
            ->when($filters['source_school_year_id'] ?? null, function (Builder $query, int|string $sourceSchoolYearId) use ($filters): void {
                $query->whereHas('studentEnrollments', function (Builder $query) use ($sourceSchoolYearId, $filters): void {
                    $query
                        ->forSchoolYear((int) $sourceSchoolYearId)
                        ->when($filters['source_year_level'] ?? null, fn (Builder $query, string $yearLevel) => $query->where('year_level', $yearLevel))
                        ->when($filters['source_section'] ?? null, fn (Builder $query, string $section) => $query->where('section', $section));
                });
            })
            ->pluck('id');
    }

    /**
     * @param  array<int, int>  $memberIds
     * @param  array<string, mixed>  $filters
     *
     * @throws ValidationException
     */
    private function ensureNoDemotions(array $memberIds, string $targetYearLevel, array $filters): void
    {
        $sourceSchoolYearId = $filters['source_school_year_id'] ?? null;

        if (! $sourceSchoolYearId || $memberIds === []) {
            return;
        }

        $hasDemotion = StudentEnrollment::query()
            ->where('school_year_id', (int) $sourceSchoolYearId)
            ->whereIn('library_member_id', $memberIds)
            ->get(['year_level'])
            ->contains(fn (StudentEnrollment $enrollment): bool => AcademicLevels::isDemotion($enrollment->year_level, $targetYearLevel));

        if ($hasDemotion) {
            throw ValidationException::withMessages([
                'year_level' => 'Target year level cannot be lower than the selected student source year level.',
            ]);
        }
    }
}
