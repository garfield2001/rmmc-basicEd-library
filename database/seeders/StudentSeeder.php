<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Support\Academics\AcademicLevels;
use Database\Seeders\Data\StudentSeederData;

class StudentSeeder extends LibraryMemberSeeder
{
    public function run(): void
    {
        $previousYear = SchoolYear::query()->where('name', '2025-2026')->firstOrFail();
        $currentYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        // 1. Seed 2025-2026 original students
        $this->createStudentVisitors($this->schoolStudents(), $previousYear);
        $this->createStudentVisitors($this->generatedStudents(), $previousYear);

        // 2. Promote students from 2025-2026 into 2026-2027
        $this->promoteStudentsToCurrentYear($previousYear, $currentYear);

        // 3. Seed incoming students for 2026-2027 (new Kinder 1 & transferees to populate all sections)
        $this->seedIncomingCurrentYearStudents($currentYear);
    }

    /**
     * Add real school student details here.
     *
     * @return array<int, array<string, mixed>>
     */
    private function schoolStudents(): array
    {
        return $this->attachManualDetails($this->manualStudentVisitors(), StudentSeederData::manualDetails());
    }

    /**
     * @return array<string, array<string, int>>
     */
    private function rosterPlan(): array
    {
        return StudentSeederData::rosterPlan();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function generatedStudents(): array
    {
        $students = [];

        foreach ($this->rosterPlan() as $yearLevel => $sections) {
            $yearIndex = AcademicLevels::rank($yearLevel);
            $sectionNumber = 1;

            foreach ($sections as $section => $studentCount) {
                foreach (range(1, $studentCount) as $studentIndex) {
                    $students[] = [
                        'school_id' => $this->fakeStudentSchoolId(25, $yearIndex, $sectionNumber, $studentIndex),
                        'first_name' => fake()->firstName(),
                        'middle_name' => fake()->optional(0.25)->lastName(),
                        'last_name' => fake()->lastName(),
                        'year_level' => $yearLevel,
                        'section' => $section,
                    ];
                }

                $sectionNumber++;
            }
        }

        return $students;
    }

    private function promoteStudentsToCurrentYear(SchoolYear $fromYear, SchoolYear $toYear): void
    {
        $members = LibraryMember::query()
            ->where('type', LibraryMember::TYPE_STUDENT)
            ->whereHas('studentSchoolYearRecords', fn ($query) => $query->forSchoolYear($fromYear->id))
            ->with(['studentSchoolYearRecords' => fn ($query) => $query->where('school_year_id', $fromYear->id)])
            ->get();

        foreach ($members as $member) {
            $previousRecord = $member->studentSchoolYearRecords->first();
            if (! $previousRecord) {
                continue;
            }

            $currentYearLevel = $previousRecord->year_level;
            $currentSection = $previousRecord->section;
            $nextYearLevel = AcademicLevels::nextAfter($currentYearLevel);

            // Grade 10 students from 2025-2026 completed Junior High (alumni)
            if ($nextYearLevel === null) {
                continue;
            }

            // Only promote the continuing section when transitioning from multi-section to single-section
            if ($currentYearLevel === 'Grade 6' && ! in_array($currentSection, ['Integrity', null], true)) {
                // Grade 6 Justice & Kindness are elementary graduates
                continue;
            }

            if ($currentYearLevel === 'Grade 8' && ! in_array($currentSection, ['Nobility', null], true)) {
                // Grade 8 Optimism moved / transferred
                continue;
            }

            // Route students to appropriate target section in 2026-2027
            $nextSectionName = match ($nextYearLevel) {
                'Kindergarten 2' => 'Banaba',
                'Grade 1' => 'Camia',
                'Grade 2' => 'Dahlia',
                'Grade 3' => 'Emerald',
                'Grade 4' => 'Fortitude',
                'Grade 5' => 'Garnet',
                'Grade 6' => 'Integrity',
                'Grade 7' => 'Loyalty',
                'Grade 8' => 'Nobility',
                'Grade 9' => 'Quest',
                'Grade 10' => 'Wisdom',
                default => 'A',
            };

            $section = SchoolYearSection::query()->firstOrCreate([
                'school_year_id' => $toYear->id,
                'year_level' => $nextYearLevel,
                'name' => $nextSectionName,
            ]);

            $member->studentSchoolYearRecords()->create([
                'school_year_id' => $toYear->id,
                'school_year_section_id' => $section->id,
                'school_id' => $member->school_id,
                'rfid_uid' => $member->rfid_uid,
                'first_name' => $member->first_name,
                'middle_name' => $member->middle_name,
                'last_name' => $member->last_name,
                'photo' => $member->photo,
                'year_level' => $nextYearLevel,
                'section' => $nextSectionName,
            ]);
        }
    }

    private function seedIncomingCurrentYearStudents(SchoolYear $currentYear): void
    {
        $incomingPlan = [
            'Kindergarten 1' => ['Acacia' => 28],
            'Grade 6' => ['Justice' => 26, 'Kindness' => 29],
            'Grade 8' => ['Optimism' => 28],
            'Grade 10' => ['Xavier' => 27],
        ];

        $students = [];

        foreach ($incomingPlan as $yearLevel => $sections) {
            $yearIndex = AcademicLevels::rank($yearLevel);
            $sectionNumber = 1;

            foreach ($sections as $section => $studentCount) {
                foreach (range(1, $studentCount) as $studentIndex) {
                    $students[] = [
                        'school_id' => $this->fakeStudentSchoolId(26, $yearIndex, $sectionNumber + 5, $studentIndex + 100),
                        'first_name' => fake()->firstName(),
                        'middle_name' => fake()->optional(0.25)->lastName(),
                        'last_name' => fake()->lastName(),
                        'year_level' => $yearLevel,
                        'section' => $section,
                    ];
                }

                $sectionNumber++;
            }
        }

        $this->createStudentVisitors($students, $currentYear);
    }

    private function fakeStudentSchoolId(int $yearPrefix, int $yearIndex, int $sectionNumber, int $studentIndex): string
    {
        return sprintf('%02d%02d%02d%04d', $yearPrefix, $yearIndex, $sectionNumber, $studentIndex);
    }
}