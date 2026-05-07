<?php

namespace App\Services\SchoolYears;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\StudentEnrollment;
use App\Support\Academics\AcademicLevels;
use Illuminate\Support\Facades\DB;

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
        return DB::transaction(function () use ($schoolYear): SchoolYear {
            $previousActiveSchoolYear = SchoolYear::active()->whereKeyNot($schoolYear->id)->first();

            SchoolYear::query()->whereKeyNot($schoolYear->id)->update(['is_active' => false]);
            $schoolYear->update(['is_active' => true]);

            if ($previousActiveSchoolYear) {
                $this->promoteStudents($previousActiveSchoolYear, $schoolYear);
            }

            return $schoolYear->refresh();
        });
    }

    private function promoteStudents(SchoolYear $fromSchoolYear, SchoolYear $toSchoolYear): int
    {
        $promoted = 0;

        StudentEnrollment::query()
            ->with('member:id,type')
            ->where('school_year_id', $fromSchoolYear->id)
            ->orderBy('id')
            ->get()
            ->each(function (StudentEnrollment $enrollment) use ($toSchoolYear, &$promoted): void {
                if ($enrollment->member?->type !== LibraryMember::TYPE_STUDENT) {
                    return;
                }

                $nextYearLevel = AcademicLevels::nextAfter($enrollment->year_level);

                if (! $nextYearLevel) {
                    return;
                }

                $promotedEnrollment = StudentEnrollment::query()->firstOrCreate(
                    [
                        'library_member_id' => $enrollment->library_member_id,
                        'school_year_id' => $toSchoolYear->id,
                    ],
                    [
                        'school_year_section_id' => null,
                        'year_level' => $nextYearLevel,
                        'section' => null,
                    ],
                );

                if ($promotedEnrollment->wasRecentlyCreated) {
                    $promoted++;
                }
            });

        return $promoted;
    }
}
