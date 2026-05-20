<?php

namespace Database\Seeders\Support;

use InvalidArgumentException;

final class LibraryVisitorSeederGuard
{
    /**
     * @var array<int, string>
     */
    private static array $usedRFIDs = [];

    /**
     * @var array<int, string>
     */
    private static array $usedSchoolIds = [];

    public static function reset(): void
    {
        self::$usedRFIDs = [];
        self::$usedSchoolIds = [];
    }

    public static function studentSchoolId(mixed $schoolId): void
    {
        if (! is_string($schoolId) || ! preg_match('/^\d{10}$/', $schoolId)) {
            throw new InvalidArgumentException('Student school ID must be exactly 10 digits.');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, string>  $fields
     */
    public static function requiredDetails(array $data, array $fields): void
    {
        foreach ($fields as $field) {
            if (! isset($data[$field]) || ! is_string($data[$field]) || trim($data[$field]) === '') {
                throw new InvalidArgumentException("Seeder field [{$field}] is required.");
            }

            self::shortText($field, $data[$field]);
        }
    }

    /**
     * @param  array<string, mixed>  $visitorData
     */
    public static function visitorData(array $visitorData): void
    {
        self::requiredDetails($visitorData, ['school_id', 'first_name', 'last_name']);

        foreach (['middle_name', 'photo'] as $field) {
            if (isset($visitorData[$field]) && $visitorData[$field] !== null) {
                self::shortText($field, $visitorData[$field]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $visitorData
     */
    public static function rfidUid(array $visitorData): string
    {
        if (! empty($visitorData['rfid_uid'])) {
            if (! is_string($visitorData['rfid_uid'])) {
                throw new InvalidArgumentException('Seeder RFID must be stored as a string.');
            }

            return self::useManualRFID($visitorData['rfid_uid']);
        }

        return self::randomRFID();
    }

    public static function schoolId(string $schoolId): string
    {
        if (in_array($schoolId, self::$usedSchoolIds, true)) {
            throw new InvalidArgumentException("Seeder school ID [{$schoolId}] is already used.");
        }

        self::$usedSchoolIds[] = $schoolId;

        return $schoolId;
    }

    private static function shortText(string $field, mixed $value): void
    {
        if (! is_string($value) || strlen($value) > 255) {
            throw new InvalidArgumentException("Seeder field [{$field}] must be a string up to 255 characters.");
        }
    }

    private static function useManualRFID(string $rfidUid): string
    {
        if (! preg_match('/^\d{10}$/', $rfidUid)) {
            throw new InvalidArgumentException("Seeder RFID [{$rfidUid}] must be exactly 10 digits.");
        }

        if (in_array($rfidUid, self::$usedRFIDs, true)) {
            throw new InvalidArgumentException("Seeder RFID [{$rfidUid}] is already used.");
        }

        self::$usedRFIDs[] = $rfidUid;

        return $rfidUid;
    }

    private static function randomRFID(): string
    {
        do {
            $rfidUid = (string) random_int(1000000000, 9999999999);
        } while (in_array($rfidUid, self::$usedRFIDs, true));

        self::$usedRFIDs[] = $rfidUid;

        return $rfidUid;
    }
}
