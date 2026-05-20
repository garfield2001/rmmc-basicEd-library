<?php

namespace App\Services\Library;

use App\Models\LibraryMember;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class LibraryMemberTableService
{
    public const SORT_COLUMNS = ['name', 'school_id', 'year_level', 'section', 'department'];

    public const ROW_OPTIONS = [5, 10, 30, 50, 100];

    public function __construct(private readonly LibraryMemberDuplicateService $duplicates) {}

    public function typeOption(string $type): string
    {
        return in_array($type, [LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE], true)
            ? $type
            : LibraryMember::TYPE_STUDENT;
    }

    public function sortOption(string $sort): string
    {
        return in_array($sort, self::SORT_COLUMNS, true)
            ? $sort
            : 'created_at';
    }

    public function directionOption(string $direction): string
    {
        return $direction === 'asc' ? 'asc' : 'desc';
    }

    public function perPageOption(Request $request): int|string
    {
        if ($request->string('per_page')->toString() === 'all') {
            return 'all';
        }

        return in_array($request->integer('per_page'), self::ROW_OPTIONS, true)
            ? $request->integer('per_page')
            : 5;
    }

    public function filteredQuery(string $type, string $search, string $yearLevel, string $section, ?int $activeSchoolYearId, string $department = ''): Builder
    {
        return LibraryMember::query()
            ->with([
                'student' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
                'employee' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
            ])
            ->ofType($type)
            ->search($search)
            ->when($type === LibraryMember::TYPE_STUDENT, function (Builder $query) use ($activeSchoolYearId, $yearLevel, $section): void {
                if (! $activeSchoolYearId) {
                    $query->whereKey([]);

                    return;
                }

                $query->whereHas('studentSchoolYearRecords', function (Builder $query) use ($activeSchoolYearId, $yearLevel, $section): void {
                    $query
                        ->forSchoolYear($activeSchoolYearId)
                        ->when($yearLevel, fn (Builder $query) => $query->where('year_level', $yearLevel))
                        ->when($section, fn (Builder $query) => $query->where('section', $section));
                });
            })
            ->when(
                $type === LibraryMember::TYPE_EMPLOYEE,
                function (Builder $query) use ($activeSchoolYearId, $department): void {
                    if (! $activeSchoolYearId) {
                        $query->whereKey([]);

                        return;
                    }

                    $query->whereHas('employeeSchoolYearRecords', fn (Builder $query) => $query
                        ->forSchoolYear($activeSchoolYearId)
                        ->when($department, fn (Builder $query) => $query->where('department', $department)));
                },
            )
            ->tap(fn (Builder $query) => $this->duplicates->applyCanonicalFilter($query, $type, $activeSchoolYearId))
            ->select('library_members.*');
    }

    public function applySort(Builder $query, string $sort, string $direction, ?int $activeSchoolYearId): void
    {
        match ($sort) {
            'name' => $query
                ->orderBy('library_members.last_name', $direction)
                ->orderBy('library_members.first_name', $direction),
            'school_id' => $query->orderBy('library_members.school_id', $direction),
            'year_level' => $this->sortByActiveStudentColumn($query, 'year_level', $direction, $activeSchoolYearId),
            'section' => $this->sortByActiveStudentColumn($query, 'section', $direction, $activeSchoolYearId),
            'department' => $activeSchoolYearId
                ? $query
                    ->leftJoin('employee_school_year_records as visitor_employee_school_year_records', function ($join) use ($activeSchoolYearId): void {
                        $join
                            ->on('visitor_employee_school_year_records.library_member_id', '=', 'library_members.id')
                            ->where('visitor_employee_school_year_records.school_year_id', '=', $activeSchoolYearId);
                    })
                    ->orderBy('visitor_employee_school_year_records.department', $direction)
                : $query->orderBy('library_members.created_at', 'desc'),
            default => $query->orderBy('library_members.created_at', 'desc'),
        };

        $query->orderBy('library_members.id', 'desc');
    }

    private function sortByActiveStudentColumn(Builder $query, string $column, string $direction, ?int $activeSchoolYearId): void
    {
        if (! $activeSchoolYearId) {
            $query->orderBy('library_members.created_at', 'desc');

            return;
        }

        $query
            ->leftJoin('student_school_year_records as active_student_school_year_records', function ($join) use ($activeSchoolYearId): void {
                $join
                    ->on('active_student_school_year_records.library_member_id', '=', 'library_members.id')
                    ->where('active_student_school_year_records.school_year_id', '=', $activeSchoolYearId);
            })
            ->orderBy("active_student_school_year_records.{$column}", $direction);
    }
}
