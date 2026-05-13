<?php

namespace App\Services\SchoolYears;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Support\Academics\AcademicLevels;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SchoolYearService
{
    public function create(array $data): SchoolYear
    {
        return DB::transaction(function () use ($data): SchoolYear {
            $makeActive = (bool) ($data['make_active'] ?? true);
            $previousActiveSchoolYear = $makeActive ? SchoolYear::active()->first() : null;

            if ($makeActive) {
                SchoolYear::query()->update(['is_active' => false]);
            }

            $schoolYear = SchoolYear::create([
                'name' => $data['name'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'minimum_visits' => $data['minimum_visits'],
                'target_visits' => $data['target_visits'],
                'is_active' => $makeActive,
            ]);

            if ($previousActiveSchoolYear) {
                $this->promoteStudents($previousActiveSchoolYear, $schoolYear);
            }

            return $schoolYear;
        });
    }

    public function activate(SchoolYear $schoolYear): SchoolYear
    {
        throw ValidationException::withMessages([
            'school_year' => 'Previous school years cannot be reactivated after a transition. Create the next school year to move forward.',
        ]);
    }

    public function update(SchoolYear $schoolYear, array $data): SchoolYear
    {
        return DB::transaction(function () use ($schoolYear, $data): SchoolYear {
            $schoolYear->update([
                'name' => $data['name'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'minimum_visits' => $data['minimum_visits'],
                'target_visits' => $data['target_visits'],
                'is_active' => $schoolYear->is_active,
            ]);

            return $schoolYear->refresh();
        });
    }

    private function promoteStudents(SchoolYear $fromSchoolYear, SchoolYear $toSchoolYear): int
    {
        $promoted = 0;

        StudentSchoolYearRecord::query()
            ->with('member:id,type')
            ->where('school_year_id', $fromSchoolYear->id)
            ->orderBy('id')
            ->get()
            ->each(function (StudentSchoolYearRecord $studentRecord) use ($toSchoolYear, &$promoted): void {
                if ($studentRecord->member?->type !== RegisteredVisitor::TYPE_STUDENT) {
                    return;
                }

                $nextYearLevel = AcademicLevels::nextAfter($studentRecord->year_level);

                if (! $nextYearLevel) {
                    $studentRecord->member?->delete();

                    return;
                }

                $promotedStudentRecord = StudentSchoolYearRecord::query()->firstOrCreate(
                    [
                        'registered_visitor_id' => $studentRecord->registered_visitor_id,
                        'school_year_id' => $toSchoolYear->id,
                    ],
                    [
                        'school_year_section_id' => null,
                        'year_level' => $nextYearLevel,
                        'section' => null,
                    ],
                );

                if ($promotedStudentRecord->wasRecentlyCreated) {
                    $promoted++;
                }
            });

        return $promoted;
    }
}
