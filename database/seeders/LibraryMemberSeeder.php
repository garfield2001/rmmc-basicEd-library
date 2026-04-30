<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use Illuminate\Database\Seeder;
use InvalidArgumentException;

abstract class LibraryMemberSeeder extends Seeder
{
    /**
     * @var array<int, string>
     */
    private static array $usedRfids = [];

    public static function resetUsedRfids(): void
    {
        self::$usedRfids = [];
    }

    /**
     * @param  array<string, string|null>  $student
     */
    protected function createStudentMember(array $student): LibraryMember
    {
        $member = $this->createMember($student, LibraryMember::TYPE_STUDENT);

        $member->student()->create([
            'year_level' => $student['year_level'],
            'section' => $student['section'],
        ]);

        return $member;
    }

    /**
     * @param  array<string, string|null>  $employee
     */
    protected function createEmployeeMember(array $employee): LibraryMember
    {
        $member = $this->createMember($employee, LibraryMember::TYPE_EMPLOYEE);

        $member->employee()->create([
            'department' => $employee['department'],
        ]);

        return $member;
    }

    /**
     * @param  array<string, string|null>  $memberData
     */
    private function createMember(array $memberData, string $type): LibraryMember
    {
        return LibraryMember::create([
            'rfid_uid' => $this->rfidUid($memberData),
            'school_id' => $memberData['school_id'],
            'type' => $type,
            'first_name' => $memberData['first_name'],
            'middle_name' => $memberData['middle_name'] ?? null,
            'last_name' => $memberData['last_name'],
            'photo' => $memberData['photo'] ?? null,
            'is_active' => $memberData['is_active'] ?? true,
        ]);
    }

    /**
     * @param  array<string, string|null>  $memberData
     */
    private function rfidUid(array $memberData): string
    {
        if (! empty($memberData['rfid_uid'])) {
            return $this->useManualRfid($memberData['rfid_uid']);
        }

        return $this->randomRfid();
    }

    private function useManualRfid(string $rfidUid): string
    {
        if (! preg_match('/^\d{10}$/', $rfidUid)) {
            throw new InvalidArgumentException("Seeder RFID [{$rfidUid}] must be exactly 10 digits.");
        }

        if (in_array($rfidUid, self::$usedRfids, true)) {
            throw new InvalidArgumentException("Seeder RFID [{$rfidUid}] is already used.");
        }

        self::$usedRfids[] = $rfidUid;

        return $rfidUid;
    }

    private function randomRfid(): string
    {
        do {
            $rfidUid = (string) random_int(1000000000, 9999999999);
        } while (in_array($rfidUid, self::$usedRfids, true));

        self::$usedRfids[] = $rfidUid;

        return $rfidUid;
    }
}
