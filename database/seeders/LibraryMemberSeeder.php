<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use Illuminate\Database\Seeder;
use InvalidArgumentException;

abstract class LibraryMemberSeeder extends Seeder
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
     * Add manual student library member records here.
     *
     * Keep the RFID UID fixed when you need to test a known physical card.
     * Student-only details live in StudentSeeder.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function manualStudentMembers(): array
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
                'photo' => '487408466_2842190175960854_2337569948505719080_n.jpg',
            ],
        ];
    }

    /**
     * Add manual employee library member records here.
     *
     * Keep the RFID UID fixed when you need to test a known physical card.
     * Employee-only details live in EmployeeSeeder.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function manualEmployeeMembers(): array
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
            /*             [
                'school_id' => 'OP1-319',
                'rfid_uid' => '3476642503',
                'first_name' => 'Joshua',
                'middle_name' => null,
                'last_name' => 'Palacios',
            ], */
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $members
     * @param  array<string, array<string, mixed>>  $detailsBySchoolId
     * @return array<int, array<string, mixed>>
     */
    protected function attachManualDetails(array $members, array $detailsBySchoolId): array
    {
        $normalizedDetailsBySchoolId = [];

        foreach ($detailsBySchoolId as $schoolId => $details) {
            $normalizedDetailsBySchoolId[(string) $schoolId] = $details;
        }

        $memberSchoolIds = array_map('strval', array_column($members, 'school_id'));

        foreach ($memberSchoolIds as $schoolId) {
            if (! array_key_exists($schoolId, $normalizedDetailsBySchoolId)) {
                throw new InvalidArgumentException("Seeder details are missing for school ID [{$schoolId}].");
            }
        }

        foreach (array_keys($normalizedDetailsBySchoolId) as $schoolId) {
            if (! in_array((string) $schoolId, $memberSchoolIds, true)) {
                throw new InvalidArgumentException("Seeder details were provided for unknown school ID [{$schoolId}].");
            }
        }

        return array_map(
            fn (array $member): array => [
                ...$member,
                ...$normalizedDetailsBySchoolId[(string) $member['school_id']],
            ],
            $members,
        );
    }

    /**
     * @param  array<string, mixed>  $student
     */
    protected function createStudentMember(array $student): LibraryMember
    {
        $this->validateDetailData($student, ['year_level', 'section']);
        $this->validateStudentSchoolId($student['school_id']);

        $member = $this->createMember($student, LibraryMember::TYPE_STUDENT);
        $schoolYear = SchoolYear::active()->firstOrFail();
        $section = SchoolYearSection::query()->firstOrCreate([
            'school_year_id' => $schoolYear->id,
            'year_level' => $student['year_level'],
            'name' => $student['section'],
        ]);

        $member->studentEnrollments()->create([
            'school_year_id' => $schoolYear->id,
            'school_year_section_id' => $section->id,
            'year_level' => $student['year_level'],
            'section' => $section->name,
        ]);

        return $member;
    }

    /**
     * @param  array<int, array<string, mixed>>  $students
     */
    protected function createStudentMembers(array $students): void
    {
        foreach ($students as $student) {
            $this->createStudentMember($student);
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
    protected function createEmployeeMember(array $employee): LibraryMember
    {
        $this->validateDetailData($employee, ['department']);

        $member = $this->createMember($employee, LibraryMember::TYPE_EMPLOYEE);

        $member->employee()->create([
            'department' => $employee['department'],
        ]);

        return $member;
    }

    /**
     * @param  array<int, array<string, mixed>>  $employees
     */
    protected function createEmployeeMembers(array $employees): void
    {
        foreach ($employees as $employee) {
            $this->createEmployeeMember($employee);
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
     * @param  array<string, mixed>  $memberData
     */
    private function createMember(array $memberData, string $type): LibraryMember
    {
        $this->validateMemberData($memberData);

        return LibraryMember::create([
            'rfid_uid' => $this->resolveRFIDUid($memberData),
            'school_id' => $this->useManualSchoolId($memberData['school_id']),
            'type' => $type,
            'first_name' => $memberData['first_name'],
            'middle_name' => $memberData['middle_name'] ?? null,
            'last_name' => $memberData['last_name'],
            'photo' => $memberData['photo'] ?? null,
            'is_active' => $memberData['is_active'] ?? true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $memberData
     */
    private function validateMemberData(array $memberData): void
    {
        foreach (['school_id', 'first_name', 'last_name'] as $field) {
            if (! isset($memberData[$field]) || ! is_string($memberData[$field]) || trim($memberData[$field]) === '') {
                throw new InvalidArgumentException("Seeder field [{$field}] is required.");
            }

            if (strlen($memberData[$field]) > 255) {
                throw new InvalidArgumentException("Seeder field [{$field}] must not be longer than 255 characters.");
            }
        }

        foreach (['middle_name', 'photo'] as $field) {
            if (isset($memberData[$field]) && $memberData[$field] !== null && (! is_string($memberData[$field]) || strlen($memberData[$field]) > 255)) {
                throw new InvalidArgumentException("Seeder field [{$field}] must be null or a string up to 255 characters.");
            }
        }
    }

    /**
     * @param  array<string, mixed>  $memberData
     */
    private function resolveRFIDUid(array $memberData): string
    {
        if (! empty($memberData['rfid_uid'])) {
            if (! is_string($memberData['rfid_uid'])) {
                throw new InvalidArgumentException('Seeder RFID must be stored as a string.');
            }

            return $this->useManualRFID($memberData['rfid_uid']);
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
