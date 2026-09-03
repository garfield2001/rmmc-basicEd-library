<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class LibraryVisitSeeder extends Seeder
{
    private array $schoolDaysByMonth = [];

    public function run(): void
    {
        $schoolYears = SchoolYear::query()->orderBy('starts_at')->get();

        foreach ($schoolYears as $schoolYear) {
            $this->schoolDaysByMonth = [];
            $this->buildSchoolCalendar($schoolYear);
            $this->seedStudentVisits($schoolYear);
            $this->seedEmployeeVisits($schoolYear);
        }
    }

    private function buildSchoolCalendar(SchoolYear $schoolYear): void
    {
        $calendarEndDate = $schoolYear->is_active
            ? min($schoolYear->endDate(), now()->subDay()->startOfDay())
            : $schoolYear->endDate();

        $period = CarbonPeriod::create($schoolYear->startDate(), $calendarEndDate);
        $startYear = $schoolYear->startDate()->year;
        $holidayStart = Carbon::create($startYear, 12, 20);
        $holidayEnd = Carbon::create($startYear + 1, 1, 4);

        foreach ($period as $date) {
            // Skip weekends (Saturday & Sunday)
            if ($date->isWeekend()) {
                continue;
            }

            // Skip Christmas / New Year holiday break
            if ($date->between($holidayStart, $holidayEnd)) {
                continue;
            }

            $monthKey = $date->format('m');
            $this->schoolDaysByMonth[$monthKey][] = $date->toDateString();
        }
    }

    private function seedStudentVisits(SchoolYear $schoolYear): void
    {
        $students = LibraryMember::query()
            ->where('type', LibraryMember::TYPE_STUDENT)
            ->whereHas('studentSchoolYearRecords', fn ($query) => $query->forSchoolYear($schoolYear->id))
            ->with(['studentSchoolYearRecords' => fn ($query) => $query->where('school_year_id', $schoolYear->id)])
            ->orderBy('school_id')
            ->get();

        $visits = [];

        foreach ($students as $index => $visitor) {
            $record = $visitor->studentSchoolYearRecords->first();
            $yearLevel = $record?->year_level ?? 'Grade 1';
            $section = $record?->section ?? 'A';

            $visitCount = $this->studentVisitCount($index, $schoolYear->id);
            if ($visitCount === 0) {
                continue;
            }

            $weights = $this->sectionMonthlyWeights($yearLevel, $section);
            $chosenDates = $this->pickVisitDates($visitCount, $weights);

            foreach ($chosenDates as $visitNumber => $dateString) {
                $visitedAt = $this->buildTimestamp($dateString, $index, $visitNumber, $schoolYear->id);

                $visits[] = [
                    'library_member_id' => $visitor->id,
                    'school_year_id' => $schoolYear->id,
                    'visited_at' => $visitedAt,
                    'created_at' => $visitedAt,
                    'updated_at' => $visitedAt,
                ];
            }
        }

        foreach (array_chunk($visits, 300) as $chunk) {
            LibraryVisit::query()->insert($chunk);
        }
    }

    private function seedEmployeeVisits(SchoolYear $schoolYear): void
    {
        $employees = LibraryMember::query()
            ->where('type', LibraryMember::TYPE_EMPLOYEE)
            ->whereHas('employeeSchoolYearRecords', fn ($query) => $query->forSchoolYear($schoolYear->id))
            ->with(['employeeSchoolYearRecords' => fn ($query) => $query->where('school_year_id', $schoolYear->id)])
            ->orderBy('school_id')
            ->get();

        $visits = [];

        foreach ($employees as $index => $visitor) {
            $record = $visitor->employeeSchoolYearRecords->first();
            $department = $record?->department ?? 'Elementary';

            $visitCount = $this->employeeVisitCount($index, $schoolYear->id);
            if ($visitCount === 0) {
                continue;
            }

            $weights = $this->departmentMonthlyWeights($department);
            $chosenDates = $this->pickVisitDates($visitCount, $weights);

            foreach ($chosenDates as $visitNumber => $dateString) {
                $visitedAt = $this->buildTimestamp($dateString, $index + 500, $visitNumber, $schoolYear->id);

                $visits[] = [
                    'library_member_id' => $visitor->id,
                    'school_year_id' => $schoolYear->id,
                    'visited_at' => $visitedAt,
                    'created_at' => $visitedAt,
                    'updated_at' => $visitedAt,
                ];
            }
        }

        foreach (array_chunk($visits, 300) as $chunk) {
            LibraryVisit::query()->insert($chunk);
        }
    }

    private function studentVisitCount(int $index, int $schoolYearId): int
    {
        $offset = ($index + ($schoolYearId * 7));

        return match (true) {
            $offset % 29 === 0 => 0,
            $offset % 19 === 0 => 1,
            $offset % 13 === 0 => 2,
            $offset % 7 === 0 => 3,
            $offset % 31 === 1 => 11 + ($offset % 4), // Super active power readers
            $offset % 5 === 0 => 6 + ($offset % 3),
            $offset % 3 === 0 => 4 + ($offset % 2),
            default => 4 + ($offset % 4),
        };
    }

    private function employeeVisitCount(int $index, int $schoolYearId): int
    {
        $offset = ($index + ($schoolYearId * 11));

        return match (true) {
            $offset % 23 === 0 => 0,
            $offset % 17 === 0 => 1,
            $offset % 11 === 0 => 2,
            $offset % 7 === 0 => 3,
            $offset % 19 === 1 => 10 + ($offset % 4), // High activity faculty
            $offset % 4 === 0 => 6 + ($offset % 3),
            default => 4 + ($offset % 3),
        };
    }

    /**
     * @param  array<string, int>  $monthlyWeights
     * @return array<int, string>
     */
    private function pickVisitDates(int $count, array $monthlyWeights): array
    {
        $weightedMonths = [];
        foreach ($monthlyWeights as $month => $weight) {
            if (! empty($this->schoolDaysByMonth[$month])) {
                for ($w = 0; $w < $weight; $w++) {
                    $weightedMonths[] = $month;
                }
            }
        }

        if (empty($weightedMonths)) {
            $weightedMonths = array_keys($this->schoolDaysByMonth);
        }

        $dates = [];
        $usedDates = [];

        for ($i = 0; $i < $count; $i++) {
            $month = $weightedMonths[array_rand($weightedMonths)];
            $monthDays = $this->schoolDaysByMonth[$month];

            // Try to find an unused date for this visitor
            $day = $monthDays[array_rand($monthDays)];
            $attempts = 0;
            while (in_array($day, $usedDates, true) && $attempts < 10) {
                $day = $monthDays[array_rand($monthDays)];
                $attempts++;
            }

            $usedDates[] = $day;
            $dates[] = $day;
        }

        sort($dates);

        return $dates;
    }

    private function buildTimestamp(string $dateString, int $index, int $visitNumber, int $schoolYearId): string
    {
        // Operating hours: 07:45 to 16:30
        $hourOffsets = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        $hour = $hourOffsets[(($index * 3) + ($visitNumber * 7) + $schoolYearId) % count($hourOffsets)];

        $minute = (($index * 11) + ($visitNumber * 19) + ($schoolYearId * 3)) % 60;
        if ($hour === 7 && $minute < 45) {
            $minute = 45 + ($minute % 15);
        }
        if ($hour === 16 && $minute > 30) {
            $minute = $minute % 30;
        }

        $second = (($index * 17) + ($visitNumber * 23) + ($schoolYearId * 5)) % 60;

        return sprintf('%s %02d:%02d:%02d', $dateString, $hour, $minute, $second);
    }

    /**
     * @return array<string, int>
     */
    private function sectionMonthlyWeights(string $yearLevel, string $section): array
    {
        return match ($yearLevel) {
            'Kindergarten 1', 'Kindergarten 2' => [
                '06' => 14, '07' => 16, '08' => 8, '09' => 8,
                '10' => 20, '11' => 10, '12' => 6, '01' => 12,
                '02' => 12, '03' => 8,
            ],
            'Grade 1', 'Grade 2' => [
                '06' => 10, '07' => 18, '08' => 12, '09' => 12,
                '10' => 22, '11' => 12, '12' => 6, '01' => 14,
                '02' => 12, '03' => 10,
            ],
            'Grade 3', 'Grade 4' => [
                '06' => 8, '07' => 12, '08' => 20, '09' => 20,
                '10' => 16, '11' => 14, '12' => 6, '01' => 14,
                '02' => 14, '03' => 10,
            ],
            'Grade 5' => [
                '06' => 6, '07' => 10, '08' => 24, '09' => 24,
                '10' => 12, '11' => 14, '12' => 6, '01' => 12,
                '02' => 16, '03' => 10,
            ],
            'Grade 6' => match ($section) {
                'Integrity' => [
                    '06' => 6, '07' => 8, '08' => 30, '09' => 30,
                    '10' => 10, '11' => 10, '12' => 4, '01' => 12,
                    '02' => 16, '03' => 14,
                ],
                'Justice' => [
                    '06' => 5, '07' => 8, '08' => 12, '09' => 14,
                    '10' => 28, '11' => 26, '12' => 6, '01' => 12,
                    '02' => 20, '03' => 16,
                ],
                'Kindness' => [
                    '06' => 4, '07' => 6, '08' => 10, '09' => 12,
                    '10' => 12, '11' => 14, '12' => 6, '01' => 28,
                    '02' => 32, '03' => 22,
                ],
                default => [
                    '06' => 6, '07' => 8, '08' => 22, '09' => 22,
                    '10' => 14, '11' => 14, '12' => 6, '01' => 16,
                    '02' => 22, '03' => 16,
                ],
            },
            'Grade 7' => [
                '06' => 24, '07' => 26, '08' => 12, '09' => 10,
                '10' => 12, '11' => 16, '12' => 6, '01' => 12,
                '02' => 12, '03' => 8,
            ],
            'Grade 8' => match ($section) {
                'Nobility' => [
                    '06' => 4, '07' => 8, '08' => 12, '09' => 16,
                    '10' => 32, '11' => 28, '12' => 6, '01' => 10,
                    '02' => 12, '03' => 8,
                ],
                'Optimism' => [
                    '06' => 4, '07' => 6, '08' => 8, '09' => 12,
                    '10' => 14, '11' => 30, '12' => 12, '01' => 26,
                    '02' => 16, '03' => 10,
                ],
                default => [
                    '06' => 6, '07' => 8, '08' => 12, '09' => 14,
                    '10' => 24, '11' => 26, '12' => 8, '01' => 14,
                    '02' => 14, '03' => 10,
                ],
            },
            'Grade 9' => [
                '06' => 6, '07' => 8, '08' => 16, '09' => 28,
                '10' => 14, '11' => 16, '12' => 6, '01' => 24,
                '02' => 16, '03' => 10,
            ],
            'Grade 10' => match ($section) {
                'Wisdom' => [
                    '06' => 4, '07' => 6, '08' => 10, '09' => 14,
                    '10' => 16, '11' => 18, '12' => 6, '01' => 34,
                    '02' => 36, '03' => 26,
                ],
                'Xavier' => [
                    '06' => 4, '07' => 6, '08' => 10, '09' => 14,
                    '10' => 18, '11' => 20, '12' => 8, '01' => 30,
                    '02' => 38, '03' => 28,
                ],
                default => [
                    '06' => 5, '07' => 6, '08' => 10, '09' => 14,
                    '10' => 17, '11' => 19, '12' => 7, '01' => 32,
                    '02' => 37, '03' => 27,
                ],
            },
            default => [
                '06' => 10, '07' => 10, '08' => 10, '09' => 10,
                '10' => 10, '11' => 10, '12' => 10, '01' => 10,
                '02' => 10, '03' => 10,
            ],
        };
    }

    /**
     * @return array<string, int>
     */
    private function departmentMonthlyWeights(string $department): array
    {
        return match ($department) {
            'Elementary' => [
                '06' => 22, '07' => 24, '08' => 14, '09' => 16,
                '10' => 20, '11' => 12, '12' => 6, '01' => 20,
                '02' => 16, '03' => 12,
            ],
            'High School' => [
                '06' => 8, '07' => 14, '08' => 24, '09' => 26,
                '10' => 20, '11' => 22, '12' => 8, '01' => 22,
                '02' => 28, '03' => 18,
            ],
            'Office Personnel' => [
                '06' => 14, '07' => 16, '08' => 16, '09' => 16,
                '10' => 16, '11' => 14, '12' => 10, '01' => 16,
                '02' => 16, '03' => 14,
            ],
            default => [
                '06' => 10, '07' => 10, '08' => 10, '09' => 10,
                '10' => 10, '11' => 10, '12' => 10, '01' => 10,
                '02' => 10, '03' => 10,
            ],
        };
    }
}