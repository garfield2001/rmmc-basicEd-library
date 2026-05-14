<?php

namespace Database\Seeders;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use Illuminate\Database\Seeder;
use InvalidArgumentException;

abstract class RegisteredVisitorSeeder extends Seeder
{
    /**
     * @var array<int, string>
     */
    private static array $usedRFIDs = [];

    /**
     * @var array<int, string>
     */
    private static array $usedSchoolIds = [];

    public static function resetUsedRFIDs(): void
    {
        self::$usedRFIDs = [];
        self::$usedSchoolIds = [];
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
        return [
            [
                'school_id' => '1900001001',
                'rfid_uid' => '1000001001',
                'first_name' => 'Mikaela',
                'middle_name' => null,
                'last_name' => 'Cruz',
            ],
            [
                'school_id' => '2000001002',
                'rfid_uid' => '1000001002',
                'first_name' => 'Joaquin',
                'middle_name' => null,
                'last_name' => 'Santos',
            ],
            [
                'school_id' => '2100001003',
                'rfid_uid' => '1000001003',
                'first_name' => 'Althea',
                'middle_name' => null,
                'last_name' => 'Reyes',
            ],
            [
                'school_id' => '2200001004',
                'rfid_uid' => '1000001004',
                'first_name' => 'Nathaniel',
                'middle_name' => null,
                'last_name' => 'Garcia',
            ],
            [
                'school_id' => '2300001005',
                'rfid_uid' => '1000001005',
                'first_name' => 'Sofia',
                'middle_name' => null,
                'last_name' => 'Dela Cruz',
            ],
            [
                'school_id' => '2400001006',
                'rfid_uid' => '1000001006',
                'first_name' => 'Gabriel',
                'middle_name' => null,
                'last_name' => 'Ramos',
            ],
            [
                'school_id' => '2500001007',
                'rfid_uid' => '1000001007',
                'first_name' => 'Isabella',
                'middle_name' => null,
                'last_name' => 'Aquino',
            ],
            [
                'school_id' => '2316020010',
                'rfid_uid' => '3501199827',
                'first_name' => 'Shyne Audrey',
                'middle_name' => null,
                'last_name' => 'Ayunan',
            ],
            [
                'school_id' => '2211600042',
                'rfid_uid' => '1296838226',
                'first_name' => 'Brian Angelo',
                'middle_name' => null,
                'last_name' => 'Bognot',
            ],
            [
                'school_id' => '2311600068',
                'rfid_uid' => '0870893162',
                'first_name' => 'John Christian',
                'middle_name' => null,
                'last_name' => 'Abelgas',
            ],
            [
                'school_id' => '1811600033',
                'rfid_uid' => '1202953041',
                'first_name' => 'Bernard',
                'middle_name' => 'R.',
                'last_name' => 'Villarias',
            ],
        ];
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
        return [
            [
                'school_id' => 'EMP-2001',
                'rfid_uid' => '2000002001',
                'first_name' => 'Ana',
                'middle_name' => null,
                'last_name' => 'Reyes',
            ],
            [
                'school_id' => 'EMP-2002',
                'rfid_uid' => '2000002002',
                'first_name' => 'Marco',
                'middle_name' => null,
                'last_name' => 'Villanueva',
            ],
            [
                'school_id' => 'EMP-2003',
                'rfid_uid' => '2000002003',
                'first_name' => 'Leah',
                'middle_name' => null,
                'last_name' => 'Mendoza',
            ],
            [
                'school_id' => 'EMP-2004',
                'rfid_uid' => '2000002004',
                'first_name' => 'Rafael',
                'middle_name' => null,
                'last_name' => 'Torres',
            ],
            [
                'school_id' => 'OP1-308',
                'rfid_uid' => '0163313553',
                'first_name' => 'Aaron',
                'middle_name' => null,
                'last_name' => 'Ayunan',
            ],
            [
                'school_id' => 'OP1164',
                'rfid_uid' => '0111029083',
                'first_name' => 'Anisia',
                'middle_name' => null,
                'last_name' => 'Flores',
            ],
            [
                'school_id' => 'OP1-303',
                'rfid_uid' => '1395154304',
                'first_name' => 'Gay Marie',
                'middle_name' => null,
                'last_name' => 'Farnazo',
            ],
        ];
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
    protected function createStudentVisitor(array $student): RegisteredVisitor
    {
        $this->validateDetailData($student, ['year_level', 'section']);
        $this->validateStudentSchoolId($student['school_id']);

        $visitor = $this->createVisitor($student, RegisteredVisitor::TYPE_STUDENT);
        $schoolYear = SchoolYear::active()->firstOrFail();
        $section = SchoolYearSection::query()->firstOrCreate([
            'school_year_id' => $schoolYear->id,
            'year_level' => $student['year_level'],
            'name' => $student['section'],
        ]);

        $visitor->studentRegistrations()->create([
            'school_year_id' => $schoolYear->id,
            'school_year_section_id' => $section->id,
            'year_level' => $student['year_level'],
            'section' => $section->name,
        ]);

        return $visitor;
    }

    /**
     * @param  array<int, array<string, mixed>>  $students
     */
    protected function createStudentVisitors(array $students): void
    {
        foreach ($students as $student) {
            $this->createStudentVisitor($student);
        }
    }

    private function validateStudentSchoolId(mixed $schoolId): void
    {
        if (! is_string($schoolId) || ! preg_match('/^\d{10}$/', $schoolId)) {
            throw new InvalidArgumentException('Student school ID must be exactly 10 digits.');
        }
    }

    /**
     * @param  array<string, mixed>  $employee
     */
    protected function createEmployeeVisitor(array $employee): RegisteredVisitor
    {
        $this->validateDetailData($employee, ['department']);

        $visitor = $this->createVisitor($employee, RegisteredVisitor::TYPE_EMPLOYEE);

        $visitor->employee()->create([
            'department' => $employee['department'],
        ]);

        return $visitor;
    }

    /**
     * @param  array<int, array<string, mixed>>  $employee_profiles
     */
    protected function createEmployeeVisitors(array $employee_profiles): void
    {
        foreach ($employee_profiles as $employee) {
            $this->createEmployeeVisitor($employee);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, string>  $fields
     */
    private function validateDetailData(array $data, array $fields): void
    {
        foreach ($fields as $field) {
            if (! isset($data[$field]) || ! is_string($data[$field]) || trim($data[$field]) === '') {
                throw new InvalidArgumentException("Seeder field [{$field}] is required.");
            }

            if (strlen($data[$field]) > 255) {
                throw new InvalidArgumentException("Seeder field [{$field}] must not be longer than 255 characters.");
            }
        }
    }

    /**
     * @param  array<string, mixed>  $visitorData
     */
    private function createVisitor(array $visitorData, string $type): RegisteredVisitor
    {
        $this->validateVisitorData($visitorData);

        return RegisteredVisitor::create([
            'rfid_uid' => $this->resolveRFIDUid($visitorData),
            'school_id' => $this->useManualSchoolId($visitorData['school_id']),
            'type' => $type,
            'first_name' => $visitorData['first_name'],
            'middle_name' => $visitorData['middle_name'] ?? null,
            'last_name' => $visitorData['last_name'],
            'photo' => $visitorData['photo'] ?? null,
            'is_active' => $visitorData['is_active'] ?? true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $visitorData
     */
    private function validateVisitorData(array $visitorData): void
    {
        foreach (['school_id', 'first_name', 'last_name'] as $field) {
            if (! isset($visitorData[$field]) || ! is_string($visitorData[$field]) || trim($visitorData[$field]) === '') {
                throw new InvalidArgumentException("Seeder field [{$field}] is required.");
            }

            if (strlen($visitorData[$field]) > 255) {
                throw new InvalidArgumentException("Seeder field [{$field}] must not be longer than 255 characters.");
            }
        }

        foreach (['middle_name', 'photo'] as $field) {
            if (isset($visitorData[$field]) && $visitorData[$field] !== null && (! is_string($visitorData[$field]) || strlen($visitorData[$field]) > 255)) {
                throw new InvalidArgumentException("Seeder field [{$field}] must be null or a string up to 255 characters.");
            }
        }
    }

    /**
     * @param  array<string, mixed>  $visitorData
     */
    private function resolveRFIDUid(array $visitorData): string
    {
        if (! empty($visitorData['rfid_uid'])) {
            if (! is_string($visitorData['rfid_uid'])) {
                throw new InvalidArgumentException('Seeder RFID must be stored as a string.');
            }

            return $this->useManualRFID($visitorData['rfid_uid']);
        }

        return $this->randomRFID();
    }

    private function useManualRFID(string $RFIDUid): string
    {
        if (! preg_match('/^\d{10}$/', $RFIDUid)) {
            throw new InvalidArgumentException("Seeder RFID [{$RFIDUid}] must be exactly 10 digits.");
        }

        if (in_array($RFIDUid, self::$usedRFIDs, true)) {
            throw new InvalidArgumentException("Seeder RFID [{$RFIDUid}] is already used.");
        }

        self::$usedRFIDs[] = $RFIDUid;

        return $RFIDUid;
    }

    private function useManualSchoolId(string $schoolId): string
    {
        if (in_array($schoolId, self::$usedSchoolIds, true)) {
            throw new InvalidArgumentException("Seeder school ID [{$schoolId}] is already used.");
        }

        self::$usedSchoolIds[] = $schoolId;

        return $schoolId;
    }

    private function randomRFID(): string
    {
        do {
            $RFIDUid = (string) random_int(1000000000, 9999999999);
        } while (in_array($RFIDUid, self::$usedRFIDs, true));

        self::$usedRFIDs[] = $RFIDUid;

        return $RFIDUid;
    }
}
