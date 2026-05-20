<?php

namespace App\Services\Library;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Services\SchoolYears\SchoolYearSectionService;
use App\Support\Names\PersonName;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LibraryMemberService
{
    public function __construct(
        private readonly SchoolYearSectionService $sections,
        private readonly LibraryMemberDuplicateService $duplicates,
        private readonly LibraryMemberPhotoStorage $photos,
    ) {}

    public function create(array $data): LibraryMember
    {
        return DB::transaction(function () use ($data): LibraryMember {
            $data['photo'] = $this->photos->store($data['photo_file'] ?? null);
            $visitor = LibraryMember::create($this->visitorData($data));

            $this->syncDetails($visitor, $data);

            return $visitor->load(['student', 'employee']);
        });
    }

    public function update(LibraryMember $visitor, array $data): LibraryMember
    {
        return DB::transaction(function () use ($visitor, $data): LibraryMember {
            $newPhoto = $this->photos->store($data['photo_file'] ?? null);

            if ($newPhoto) {
                $this->photos->delete($visitor->photo);
                $data['photo'] = $newPhoto;
            } else {
                $data['photo'] = $visitor->photo;
            }

            $visitor->update($this->visitorData($data));
            $this->syncDetails($visitor, $data);
            $visitor = $visitor->refresh();
            $schoolYear = SchoolYear::active()->first();
            $duplicates = $this->duplicates->unresolvedCandidatesFor($visitor, $schoolYear?->id);

            if ($this->hasIdentifier($visitor) && $duplicates->isNotEmpty()) {
                if (! ($data['confirm_merge_duplicates'] ?? false)) {
                    throw ValidationException::withMessages([
                        'confirm_merge_duplicates' => "This visitor has {$duplicates->count()} unresolved duplicate profile(s). Confirm merge to keep this visitor and delete the duplicate placeholder records.",
                    ]);
                }

                $mergedCount = $this->duplicates->mergeInto($visitor, $duplicates);

                if ($mergedCount > 0) {
                    session()->flash('success', "Visitor updated and {$mergedCount} duplicate profile(s) were merged.");
                }
            }

            return $visitor->load(['student', 'employee']);
        });
    }

    private function visitorData(array $data): array
    {
        return [
            'rfid_uid' => $this->nullableText($data['rfid_uid'] ?? null),
            'school_id' => $this->nullableText($data['school_id'] ?? null),
            'type' => $data['type'],
            'first_name' => PersonName::requiredPart($data['first_name'] ?? ''),
            'middle_name' => PersonName::part($data['middle_name'] ?? null),
            'last_name' => PersonName::requiredPart($data['last_name'] ?? ''),
            'photo' => $data['photo'] ?? null,
        ];
    }

    private function syncDetails(LibraryMember $visitor, array $data): void
    {
        if ($data['type'] === LibraryMember::TYPE_STUDENT) {
            $schoolYear = $this->activeSchoolYearOrFail();
            $sectionName = trim((string) ($data['section'] ?? ''));
            $section = $sectionName !== ''
                ? $this->sections->findOrCreate($schoolYear->id, $data['year_level'], $sectionName)
                : null;

            $this->assignStudentDetails($visitor, $schoolYear->id, $data['year_level'], $section?->id, $section?->name);

            return;
        }

        $schoolYear = $this->activeSchoolYearOrFail();
        $visitor->employeeSchoolYearRecords()->updateOrCreate(
            ['school_year_id' => $schoolYear->id],
            $this->visitorSnapshot($visitor) + ['department' => $data['department']],
        );
    }

    private function activeSchoolYearOrFail(): SchoolYear
    {
        $schoolYear = SchoolYear::active()->first();

        if (! $schoolYear) {
            throw ValidationException::withMessages([
                'year_level' => 'Create or activate a school year before assigning student year level and section.',
            ]);
        }

        return $schoolYear;
    }

    private function assignStudentDetails(LibraryMember $visitor, int $schoolYearId, string $yearLevel, ?int $sectionId, ?string $sectionName): void
    {
        $visitor->studentSchoolYearRecords()->updateOrCreate(
            ['school_year_id' => $schoolYearId],
            $this->visitorSnapshot($visitor) + [
                'school_year_section_id' => $sectionId,
                'year_level' => $yearLevel,
                'section' => $sectionName,
            ],
        );
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

    private function nullableText(?string $value): ?string
    {
        return ($value = trim((string) $value)) !== '' ? $value : null;
    }

    private function hasIdentifier(LibraryMember $visitor): bool
    {
        return filled($visitor->rfid_uid) || filled($visitor->school_id);
    }
}
