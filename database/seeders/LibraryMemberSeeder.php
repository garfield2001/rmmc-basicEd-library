<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use Database\Seeders\Data\ManualLibraryVisitors;
use Database\Seeders\Support\LibraryVisitorSeederGuard;
use Illuminate\Database\Seeder;
use InvalidArgumentException;

abstract class LibraryMemberSeeder extends Seeder
{
    public static function resetUsedRFIDs(): void
    {
        LibraryVisitorSeederGuard::reset();
    }

    /**
     * Add manual student registered visitor records here.
     *
     * Keep the RFID UID fixed when you need to test a known physical card.
     * Student-only details live in StudentSeeder.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function manualStudentVisitors(): array
    {
        return ManualLibraryVisitors::students();
    }

    /**
     * Add manual employee registered visitor records here.
     *
     * Keep the RFID UID fixed when you need to test a known physical card.
     * Employee-only details live in EmployeeSeeder.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function manualEmployeeVisitors(): array
    {
        return ManualLibraryVisitors::employees();
    }

    /**
     * @param  array<int, array<string, mixed>>  $visitors
     * @param  array<string, array<string, mixed>>  $detailsBySchoolId
     * @return array<int, array<string, mixed>>
     */
    protected function attachManualDetails(array $visitors, array $detailsBySchoolId): array
    {
        $normalizedDetailsBySchoolId = [];

        foreach ($detailsBySchoolId as $schoolId => $details) {
            $normalizedDetailsBySchoolId[(string) $schoolId] = $details;
        }

        $visitorSchoolIds = array_map('strval', array_column($visitors, 'school_id'));

        foreach ($visitorSchoolIds as $schoolId) {
            if (! array_key_exists($schoolId, $normalizedDetailsBySchoolId)) {
                throw new InvalidArgumentException("Seeder details are missing for school ID [{$schoolId}].");
            }
        }

        foreach (array_keys($normalizedDetailsBySchoolId) as $schoolId) {
            if (! in_array((string) $schoolId, $visitorSchoolIds, true)) {
                throw new InvalidArgumentException("Seeder details were provided for unknown school ID [{$schoolId}].");
            }
        }

        return array_map(
            fn (array $visitor): array => [
                ...$visitor,
                ...$normalizedDetailsBySchoolId[(string) $visitor['school_id']],
            ],
            $visitors,
        );
    }

    /**
     * @param  array<string, mixed>  $student
     */
    protected function createStudentVisitor(array $student, ?SchoolYear $schoolYear = null): LibraryMember
    {
        LibraryVisitorSeederGuard::requiredDetails($student, ['year_level', 'section']);
        LibraryVisitorSeederGuard::studentSchoolId($student['school_id']);

        $visitor = $this->createVisitor($student, LibraryMember::TYPE_STUDENT);
        $targetSchoolYear = $schoolYear ?? SchoolYear::active()->firstOrFail();
        $section = SchoolYearSection::query()->firstOrCreate([
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => $student['year_level'],
            'name' => $student['section'],
        ]);

        $visitor->studentSchoolYearRecords()->create([
            'school_year_id' => $targetSchoolYear->id,
            'school_year_section_id' => $section->id,
            ...$this->visitorSnapshot($visitor),
            'year_level' => $student['year_level'],
            'section' => $section->name,
        ]);

        return $visitor;
    }

    /**
     * @param  array<int, array<string, mixed>>  $students
     */
    protected function createStudentVisitors(array $students, ?SchoolYear $schoolYear = null): void
    {
        foreach ($students as $student) {
            $this->createStudentVisitor($student, $schoolYear);
        }
    }

    /**
     * @param  array<string, mixed>  $employee
     */
    protected function createEmployeeVisitor(array $employee, ?SchoolYear $schoolYear = null): LibraryMember
    {
        LibraryVisitorSeederGuard::requiredDetails($employee, ['department']);

        $visitor = $this->createVisitor($employee, LibraryMember::TYPE_EMPLOYEE);
        $targetSchoolYear = $schoolYear ?? SchoolYear::active()->firstOrFail();

        $visitor->employeeSchoolYearRecords()->create([
            'school_year_id' => $targetSchoolYear->id,
            ...$this->visitorSnapshot($visitor),
            'department' => $employee['department'],
        ]);

        return $visitor;
    }

    protected function createEmployeeVisitors(array $employees, ?SchoolYear $schoolYear = null): void
    {
        foreach ($employees as $employee) {
            $this->createEmployeeVisitor($employee, $schoolYear);
        }
    }

    /**
     * @param  array<string, mixed>  $visitorData
     */
    private function createVisitor(array $visitorData, string $type): LibraryMember
    {
        LibraryVisitorSeederGuard::visitorData($visitorData);

        return LibraryMember::create([
            'rfid_uid' => LibraryVisitorSeederGuard::rfidUid($visitorData),
            'school_id' => LibraryVisitorSeederGuard::schoolId($visitorData['school_id']),
            'type' => $type,
            'first_name' => $visitorData['first_name'],
            'middle_name' => $visitorData['middle_name'] ?? null,
            'last_name' => $visitorData['last_name'],
            'photo' => $visitorData['photo'] ?? null,
        ]);
    }

    private function visitorSnapshot(LibraryMember $visitor): array
    {
        return [
            'school_id' => $visitor->school_id,
            'rfid_uid' => $visitor->rfid_uid,
            'first_name' => $visitor->first_name,
            'middle_name' => $visitor->middle_name,
            'last_name' => $visitor->last_name,
            'photo' => $visitor->photo,
        ];
    }
}
