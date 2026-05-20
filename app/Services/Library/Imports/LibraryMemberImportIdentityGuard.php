<?php

namespace App\Services\Library\Imports;

use App\Models\LibraryMember;

class LibraryMemberImportIdentityGuard
{
    /**
     * @param  array<string, string>  $row
     */
    public function findVisitor(array $row): ?LibraryMember
    {
        return ($row['school_id'] ?? '') !== ''
            ? LibraryMember::query()->where('school_id', $row['school_id'])->first()
            : null;
    }

    /**
     * @param  array<string, string>  $row
     */
    public function rejectionMessage(array $row, ?LibraryMember $visitor = null): ?string
    {
        if (($row['_has_disallowed_single_name_column'] ?? '') === '1') {
            return 'Full-name columns are not accepted. Use separate First Name, Middle Name, and Last Name columns.';
        }

        if (($row['_rfid_uid_raw'] ?? '') !== '' && ($row['rfid_uid'] ?? '') === '') {
            return 'RFID must be blank or contain exactly 10 digits.';
        }

        if ($message = $this->identifierConflictMessage($row, $visitor)) {
            return $message;
        }

        if ($visitor && ! $this->rowMatchesExistingIdentity($row, $visitor)) {
            return "School ID {$row['school_id']} already belongs to {$visitor->full_name}. Edit that visitor in the app if this identity needs to change.";
        }

        if ($visitor) {
            return $this->canFillMissingRfid($visitor, $row)
                ? null
                : "School ID {$row['school_id']} is already registered. Imports only create new visitors; edit existing visitor details in the app.";
        }

        if ($existingVisitor = $this->findVisitorByCompatibleIdentity($row)) {
            return "{$existingVisitor->full_name} is already registered with School ID {$existingVisitor->school_id}. Imports cannot create duplicate visitors with a different School ID.";
        }

        return null;
    }

    /**
     * @param  array<string, string>  $row
     */
    public function canFillMissingRfid(LibraryMember $visitor, array $row): bool
    {
        return ($row['rfid_uid'] ?? '') !== ''
            && blank($visitor->rfid_uid)
            && $this->rowMatchesExistingIdentity($row, $visitor);
    }

    /**
     * @param  array<string, string>  $row
     */
    private function rowMatchesExistingIdentity(array $row, LibraryMember $visitor): bool
    {
        return $visitor->type === ($row['type'] ?? null)
            && strcasecmp($this->optionalText($visitor->first_name ?? ''), $row['first_name'] ?? '') === 0
            && $this->middleNamesAreCompatible($this->optionalText($visitor->middle_name ?? ''), $row['middle_name'] ?? '')
            && strcasecmp($this->optionalText($visitor->last_name ?? ''), $row['last_name'] ?? '') === 0;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function findVisitorByCompatibleIdentity(array $row): ?LibraryMember
    {
        return LibraryMember::query()
            ->where('type', $row['type'])
            ->whereLike('first_name', $row['first_name'] ?? '', caseSensitive: false)
            ->whereLike('last_name', $row['last_name'] ?? '', caseSensitive: false)
            ->get()
            ->first(fn (LibraryMember $visitor): bool => $this->rowHasCompatibleName($row, $visitor));
    }

    /**
     * @param  array<string, string>  $row
     */
    private function rowHasCompatibleName(array $row, LibraryMember $visitor): bool
    {
        return strcasecmp($this->optionalText($visitor->first_name ?? ''), $row['first_name'] ?? '') === 0
            && strcasecmp($this->optionalText($visitor->last_name ?? ''), $row['last_name'] ?? '') === 0
            && $this->middleNamesAreCompatible($this->optionalText($visitor->middle_name ?? ''), $row['middle_name'] ?? '');
    }

    private function middleNamesAreCompatible(string $existing, string $incoming): bool
    {
        $existing = $this->optionalText($existing);
        $incoming = $this->optionalText($incoming);

        return $existing === ''
            || $incoming === ''
            || strcasecmp($existing, $incoming) === 0;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function identifierConflictMessage(array $row, ?LibraryMember $currentVisitor = null): ?string
    {
        if (($row['rfid_uid'] ?? '') === '') {
            return null;
        }

        $visitor = LibraryMember::query()->where('rfid_uid', $row['rfid_uid'])->first();

        return $visitor && $visitor->isNot($currentVisitor)
            ? "RFID {$row['rfid_uid']} already belongs to {$visitor->full_name}."
            : null;
    }

    private function optionalText(string $value): string
    {
        return trim(preg_replace('/[\s\x{00A0}]+/u', ' ', $value) ?: '');
    }
}
