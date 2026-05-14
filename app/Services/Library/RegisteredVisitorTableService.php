<?php

namespace App\Services\Library;

use App\Models\RegisteredVisitor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class RegisteredVisitorTableService
{
    public const SORT_COLUMNS = ['name', 'school_id', 'year_level', 'section', 'department'];

    public const ROW_OPTIONS = [5, 10, 30, 50, 100];

    public function typeOption(string $type): string
    {
        return in_array($type, [RegisteredVisitor::TYPE_STUDENT, RegisteredVisitor::TYPE_EMPLOYEE], true)
            ? $type
            : RegisteredVisitor::TYPE_STUDENT;
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
        return RegisteredVisitor::query()
            ->with([
                'student' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
                'employee' => fn ($query) => $query->forSchoolYear($activeSchoolYearId),
            ])
            ->ofType($type)
            ->search($search)
            ->when($type === RegisteredVisitor::TYPE_STUDENT, function (Builder $query) use ($activeSchoolYearId, $yearLevel, $section): void {
                if (! $activeSchoolYearId) {
                    $query->whereRaw('1 = 0');

                    return;
                }

                $query->whereHas('studentRegistrations', function (Builder $query) use ($activeSchoolYearId, $yearLevel, $section): void {
                    $query
                        ->forSchoolYear($activeSchoolYearId)
                        ->when($yearLevel, fn (Builder $query) => $query->where('year_level', $yearLevel))
                        ->when($section, fn (Builder $query) => $query->where('section', $section));
                    });
            })
            ->when(
                $type === RegisteredVisitor::TYPE_EMPLOYEE,
                function (Builder $query) use ($activeSchoolYearId, $department): void {
                    if (! $activeSchoolYearId) {
                        $query->whereRaw('1 = 0');

                        return;
                    }

                    $query->whereHas('employeeProfiles', fn (Builder $query) => $query
                        ->forSchoolYear($activeSchoolYearId)
                        ->when($department, fn (Builder $query) => $query->where('department', $department)));
                },
            )
            ->select('registered_visitors.*');
    }

    public function applySort(Builder $query, string $sort, string $direction, ?int $activeSchoolYearId): void
    {
        match ($sort) {
            'name' => $query
                ->orderBy('registered_visitors.last_name', $direction)
                ->orderBy('registered_visitors.first_name', $direction),
            'school_id' => $query->orderBy('registered_visitors.school_id', $direction),
            'year_level' => $this->sortByActiveStudentColumn($query, 'year_level', $direction, $activeSchoolYearId),
            'section' => $this->sortByActiveStudentColumn($query, 'section', $direction, $activeSchoolYearId),
            'department' => $activeSchoolYearId
                ? $query
                    ->leftJoin('employee_profiles as visitor_employee_profiles', function ($join) use ($activeSchoolYearId): void {
                        $join
                            ->on('visitor_employee_profiles.registered_visitor_id', '=', 'registered_visitors.id')
                            ->where('visitor_employee_profiles.school_year_id', '=', $activeSchoolYearId);
                    })
                    ->orderBy('visitor_employee_profiles.department', $direction)
                : $query->orderBy('registered_visitors.created_at', 'desc'),
            default => $query->orderBy('registered_visitors.created_at', 'desc'),
        };

        $query->orderBy('registered_visitors.id', 'desc');
    }

    private function sortByActiveStudentColumn(Builder $query, string $column, string $direction, ?int $activeSchoolYearId): void
    {
        if (! $activeSchoolYearId) {
            $query->orderBy('registered_visitors.created_at', 'desc');

            return;
        }

        $query
            ->leftJoin('student_registrations as active_student_registrations', function ($join) use ($activeSchoolYearId): void {
                $join
                    ->on('active_student_registrations.registered_visitor_id', '=', 'registered_visitors.id')
                    ->where('active_student_registrations.school_year_id', '=', $activeSchoolYearId);
            })
            ->orderBy("active_student_registrations.{$column}", $direction);
    }
}
