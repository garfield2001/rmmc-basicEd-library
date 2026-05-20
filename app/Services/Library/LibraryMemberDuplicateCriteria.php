<?php

namespace App\Services\Library;

use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\StudentSchoolYearRecord;
use Illuminate\Database\Eloquent\Builder;

class LibraryMemberDuplicateCriteria
{
    public function whereHasIdentifier(mixed $query, string $table): void
    {
        $query
            ->whereNotNull("{$table}.rfid_uid")
            ->where("{$table}.rfid_uid", '!=', '')
            ->orWhere(function ($query) use ($table): void {
                $query
                    ->whereNotNull("{$table}.school_id")
                    ->where("{$table}.school_id", '!=', '');
            });
    }

    public function whereMissingIdentifier(mixed $query, string $table): void
    {
        $query
            ->where(function ($query) use ($table): void {
                $query->whereNull("{$table}.rfid_uid")->orWhere("{$table}.rfid_uid", '');
            })
            ->where(function ($query) use ($table): void {
                $query->whereNull("{$table}.school_id")->orWhere("{$table}.school_id", '');
            });
    }

    public function whereSameActiveStudentGroup(mixed $query, int $schoolYearId): void
    {
        $query->whereExists(function ($query) use ($schoolYearId): void {
            $query
                ->select('current_student.id')
                ->from('student_school_year_records as current_student')
                ->join('student_school_year_records as duplicate_student', function ($join) use ($schoolYearId): void {
                    $join
                        ->on('duplicate_student.library_member_id', '=', 'duplicate_visitors.id')
                        ->where('duplicate_student.school_year_id', '=', $schoolYearId);
                })
                ->whereColumn('current_student.library_member_id', 'library_members.id')
                ->where('current_student.school_year_id', $schoolYearId)
                ->whereColumn('current_student.year_level', 'duplicate_student.year_level')
                ->tap(fn ($query) => $this->whereSameOptionalColumn($query, 'current_student.section', 'duplicate_student.section'));
        });
    }

    public function whereSameActiveEmployeeGroup(mixed $query, int $schoolYearId): void
    {
        $query->whereExists(function ($query) use ($schoolYearId): void {
            $query
                ->select('current_employee.id')
                ->from('employee_school_year_records as current_employee')
                ->join('employee_school_year_records as duplicate_employee', function ($join) use ($schoolYearId): void {
                    $join
                        ->on('duplicate_employee.library_member_id', '=', 'duplicate_visitors.id')
                        ->where('duplicate_employee.school_year_id', '=', $schoolYearId);
                })
                ->whereColumn('current_employee.library_member_id', 'library_members.id')
                ->where('current_employee.school_year_id', $schoolYearId)
                ->whereColumn('current_employee.department', 'duplicate_employee.department');
        });
    }

    public function whereSameStudentGroupAsVisitor(Builder $query, LibraryMember $visitor, int $schoolYearId): void
    {
        $student = StudentSchoolYearRecord::query()
            ->where('library_member_id', $visitor->id)
            ->where('school_year_id', $schoolYearId)
            ->first();

        if (! $student) {
            $query->whereKey([]);

            return;
        }

        $query->whereHas('studentSchoolYearRecords', fn (Builder $query) => $query
            ->forSchoolYear($schoolYearId)
            ->where('year_level', $student->year_level)
            ->when($student->section, fn (Builder $query) => $query->where('section', $student->section), fn (Builder $query) => $query->whereNull('section')));
    }

    public function whereSameEmployeeGroupAsVisitor(Builder $query, LibraryMember $visitor, int $schoolYearId): void
    {
        $employee = EmployeeSchoolYearRecord::query()
            ->where('library_member_id', $visitor->id)
            ->where('school_year_id', $schoolYearId)
            ->first();

        if (! $employee) {
            $query->whereKey([]);

            return;
        }

        $query->whereHas('employeeSchoolYearRecords', fn (Builder $query) => $query
            ->forSchoolYear($schoolYearId)
            ->where('department', $employee->department));
    }

    public function whereSameOptionalColumn(mixed $query, string $leftColumn, string $rightColumn): void
    {
        $query->where(function ($query) use ($leftColumn, $rightColumn): void {
            $query
                ->whereColumn($leftColumn, $rightColumn)
                ->orWhere(fn ($query) => $query->whereNull($leftColumn)->where($rightColumn, ''))
                ->orWhere(fn ($query) => $query->where($leftColumn, '')->whereNull($rightColumn))
                ->orWhere(fn ($query) => $query->whereNull($leftColumn)->whereNull($rightColumn));
        });
    }

    public function whereSameOptionalValue(Builder $query, string $column, ?string $value): void
    {
        $value = trim($value ?? '');

        $query->where(function (Builder $query) use ($column, $value): void {
            $query->where($column, $value);

            if ($value === '') {
                $query->orWhereNull($column);
            }
        });
    }
}
