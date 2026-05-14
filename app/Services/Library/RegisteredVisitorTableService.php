<?php

namespace App\Services\Library;

use App\Models\RegisteredVisitor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class RegisteredVisitorTableService
{
    public const COPY_COLUMNS = ['visitor', 'school_id', 'year_level', 'section', 'department', 'status'];

    public const SORT_COLUMNS = ['name', 'school_id', 'year_level', 'section', 'department', 'status'];

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
                'employee',
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
                $type === RegisteredVisitor::TYPE_EMPLOYEE && $department,
                fn (Builder $query) => $query->whereHas('employee', fn (Builder $query) => $query->where('department', $department)),
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
            'status' => $query->orderBy('registered_visitors.is_active', $direction),
            'year_level' => $this->sortByActiveStudentColumn($query, 'year_level', $direction, $activeSchoolYearId),
            'section' => $this->sortByActiveStudentColumn($query, 'section', $direction, $activeSchoolYearId),
            'department' => $query
                ->leftJoin('employee_profiles as visitor_employee_profiles', 'visitor_employee_profiles.registered_visitor_id', '=', 'registered_visitors.id')
                ->orderBy('visitor_employee_profiles.department', $direction),
            default => $query->orderBy('registered_visitors.created_at', 'desc'),
        };

        $query->orderBy('registered_visitors.id', 'desc');
    }

    /**
     * @param  array<int, string>  $columns
     * @return array{text: string, rowCount: int}
     */
    public function copyColumns(
        array $columns,
        string $type,
        string $search,
        string $yearLevel,
        string $section,
        string $department,
        string $sort,
        string $direction,
        ?int $activeSchoolYearId,
    ): array {
        $query = $this->filteredQuery($type, $search, $yearLevel, $section, $activeSchoolYearId, $department);
        $this->applySort($query, $sort, $direction, $activeSchoolYearId);

        $rows = $query
            ->get()
            ->map(fn (RegisteredVisitor $visitor): array => collect($columns)
                ->map(fn (string $column): string => $this->copyColumnValue($visitor, $column))
                ->all());

        $lines = $rows->map(fn (array $row): string => implode("\t", $row));

        if (count($columns) > 1) {
            $lines->prepend(implode("\t", collect($columns)->map(fn (string $column): string => $this->copyColumnLabel($column))->all()));
        }

        return [
            'text' => $lines->implode("\n"),
            'rowCount' => $rows->count(),
        ];
    }

    private function copyColumnValue(RegisteredVisitor $visitor, string $column): string
    {
        return match ($column) {
            'visitor' => $visitor->full_name,
            'school_id' => $visitor->school_id,
            'year_level' => $visitor->student?->year_level ?? '',
            'section' => $visitor->student?->section ?? '',
            'department' => $visitor->employee?->department ?? '',
            'status' => $visitor->is_active ? 'Active' : 'Inactive',
            default => '',
        };
    }

    private function copyColumnLabel(string $column): string
    {
        return match ($column) {
            'visitor' => 'Name',
            'school_id' => 'School ID',
            'year_level' => 'Year level',
            'section' => 'Section',
            'department' => 'Department',
            'status' => 'Status',
            default => $column,
        };
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
