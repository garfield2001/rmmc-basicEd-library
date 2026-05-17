<?php

namespace App\Services\Library;

use App\Models\EmployeeProfile;
use App\Models\LibraryVisit;
use App\Models\RegisteredVisitor;
use App\Models\StudentRegistration;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RegisteredVisitorDuplicateService
{
    public function applyCanonicalFilter(Builder $query, string $type, ?int $schoolYearId): void
    {
        if (! $schoolYearId) {
            return;
        }

        $query->where(function (Builder $query) use ($type, $schoolYearId): void {
            $query
                ->where(fn (Builder $query) => $this->whereHasIdentifier($query, 'registered_visitors'))
                ->orWhereNotExists(function ($query) use ($type, $schoolYearId): void {
                    $query
                        ->selectRaw('1')
                        ->from('registered_visitors as duplicate_visitors')
                        ->whereColumn('duplicate_visitors.type', 'registered_visitors.type')
                        ->whereColumn('duplicate_visitors.first_name', 'registered_visitors.first_name')
                        ->whereColumn('duplicate_visitors.last_name', 'registered_visitors.last_name')
                        ->whereRaw("coalesce(duplicate_visitors.middle_name, '') = coalesce(registered_visitors.middle_name, '')")
                        ->whereColumn('duplicate_visitors.id', '!=', 'registered_visitors.id')
                        ->where(function ($query): void {
                            $query
                                ->where(fn ($query) => $this->whereHasIdentifier($query, 'duplicate_visitors'))
                                ->orWhereColumn('duplicate_visitors.id', '<', 'registered_visitors.id');
                        })
                        ->when(
                            $type === RegisteredVisitor::TYPE_STUDENT,
                            fn ($query) => $this->whereSameActiveStudentGroup($query, $schoolYearId),
                            fn ($query) => $this->whereSameActiveEmployeeGroup($query, $schoolYearId),
                        );
                });
        });
    }

    /**
     * @return Collection<int, RegisteredVisitor>
     */
    public function unresolvedCandidatesFor(RegisteredVisitor $visitor, ?int $schoolYearId): Collection
    {
        if (! $schoolYearId) {
            return collect();
        }

        return RegisteredVisitor::query()
            ->whereKeyNot($visitor->id)
            ->where('type', $visitor->type)
            ->where('first_name', $visitor->first_name)
            ->where('last_name', $visitor->last_name)
            ->where(fn (Builder $query) => $this->whereMissingIdentifier($query, 'registered_visitors'))
            ->whereRaw("coalesce(middle_name, '') = ?", [$visitor->middle_name ?? ''])
            ->when(
                $visitor->type === RegisteredVisitor::TYPE_STUDENT,
                fn (Builder $query) => $this->whereSameStudentGroupAsVisitor($query, $visitor, $schoolYearId),
                fn (Builder $query) => $this->whereSameEmployeeGroupAsVisitor($query, $visitor, $schoolYearId),
            )
            ->orderBy('id')
            ->get();
    }

    public function mergeInto(RegisteredVisitor $keeper, Collection $duplicates): int
    {
        $merged = 0;

        DB::transaction(function () use ($keeper, $duplicates, &$merged): void {
            foreach ($duplicates as $duplicate) {
                if (! $duplicate instanceof RegisteredVisitor || $duplicate->is($keeper)) {
                    continue;
                }

                LibraryVisit::query()
                    ->where('registered_visitor_id', $duplicate->id)
                    ->update(['registered_visitor_id' => $keeper->id]);

                $duplicate->delete();
                $merged++;
            }
        });

        return $merged;
    }

    private function whereHasIdentifier(mixed $query, string $table): void
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

    private function whereMissingIdentifier(mixed $query, string $table): void
    {
        $query
            ->where(function ($query) use ($table): void {
                $query->whereNull("{$table}.rfid_uid")->orWhere("{$table}.rfid_uid", '');
            })
            ->where(function ($query) use ($table): void {
                $query->whereNull("{$table}.school_id")->orWhere("{$table}.school_id", '');
            });
    }

    private function whereSameActiveStudentGroup(mixed $query, int $schoolYearId): void
    {
        $query->whereExists(function ($query) use ($schoolYearId): void {
            $query
                ->selectRaw('1')
                ->from('student_registrations as current_student')
                ->join('student_registrations as duplicate_student', function ($join) use ($schoolYearId): void {
                    $join
                        ->on('duplicate_student.registered_visitor_id', '=', 'duplicate_visitors.id')
                        ->where('duplicate_student.school_year_id', '=', $schoolYearId);
                })
                ->whereColumn('current_student.registered_visitor_id', 'registered_visitors.id')
                ->where('current_student.school_year_id', $schoolYearId)
                ->whereColumn('current_student.year_level', 'duplicate_student.year_level')
                ->whereRaw("coalesce(current_student.section, '') = coalesce(duplicate_student.section, '')");
        });
    }

    private function whereSameActiveEmployeeGroup(mixed $query, int $schoolYearId): void
    {
        $query->whereExists(function ($query) use ($schoolYearId): void {
            $query
                ->selectRaw('1')
                ->from('employee_profiles as current_employee')
                ->join('employee_profiles as duplicate_employee', function ($join) use ($schoolYearId): void {
                    $join
                        ->on('duplicate_employee.registered_visitor_id', '=', 'duplicate_visitors.id')
                        ->where('duplicate_employee.school_year_id', '=', $schoolYearId);
                })
                ->whereColumn('current_employee.registered_visitor_id', 'registered_visitors.id')
                ->where('current_employee.school_year_id', $schoolYearId)
                ->whereColumn('current_employee.department', 'duplicate_employee.department');
        });
    }

    private function whereSameStudentGroupAsVisitor(Builder $query, RegisteredVisitor $visitor, int $schoolYearId): void
    {
        $student = StudentRegistration::query()
            ->where('registered_visitor_id', $visitor->id)
            ->where('school_year_id', $schoolYearId)
            ->first();

        if (! $student) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereHas('studentRegistrations', fn (Builder $query) => $query
            ->forSchoolYear($schoolYearId)
            ->where('year_level', $student->year_level)
            ->when($student->section, fn (Builder $query) => $query->where('section', $student->section), fn (Builder $query) => $query->whereNull('section')));
    }

    private function whereSameEmployeeGroupAsVisitor(Builder $query, RegisteredVisitor $visitor, int $schoolYearId): void
    {
        $employee = EmployeeProfile::query()
            ->where('registered_visitor_id', $visitor->id)
            ->where('school_year_id', $schoolYearId)
            ->first();

        if (! $employee) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereHas('employeeProfiles', fn (Builder $query) => $query
            ->forSchoolYear($schoolYearId)
            ->where('department', $employee->department));
    }
}
