<?php

namespace App\Services\Library;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Services\SchoolYears\SchoolYearSectionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LibraryMemberService
{
    private const PHOTO_DISK = 'member_photos';

    public function __construct(private readonly SchoolYearSectionService $sections) {}

    public function create(array $data): LibraryMember
    {
        return DB::transaction(function () use ($data): LibraryMember {
            $data['photo'] = $this->storePhoto($data['photo_file'] ?? null);
            $member = LibraryMember::create($this->memberData($data));

            $this->syncDetails($member, $data);

            return $member->load(['student', 'employee']);
        });
    }

    public function update(LibraryMember $member, array $data): LibraryMember
    {
        return DB::transaction(function () use ($member, $data): LibraryMember {
            $newPhoto = $this->storePhoto($data['photo_file'] ?? null);

            if ($newPhoto) {
                $this->deletePhoto($member->photo);
                $data['photo'] = $newPhoto;
            } else {
                $data['photo'] = $member->photo;
            }

            $member->update($this->memberData($data));
            $this->syncDetails($member, $data);

            return $member->load(['student', 'employee']);
        });
    }

    public function delete(LibraryMember $member): void
    {
        DB::transaction(function () use ($member): void {
            $member->delete();
        });
    }

    /**
     * @param  array<int, int>  $memberIds
     */
    public function bulkArchive(array $memberIds): int
    {
        return DB::transaction(fn (): int => LibraryMember::query()
            ->whereIn('id', $memberIds)
            ->delete());
    }

    public function archiveMatching(Builder $query): int
    {
        return DB::transaction(fn (): int => $query->delete());
    }

    public function restoreArchived(int $memberId): LibraryMember
    {
        return DB::transaction(function () use ($memberId): LibraryMember {
            $member = LibraryMember::onlyTrashed()->findOrFail($memberId);
            $member->restore();

            return $member;
        });
    }

    public function permanentlyDeleteArchived(int $memberId): void
    {
        DB::transaction(function () use ($memberId): void {
            $member = LibraryMember::onlyTrashed()->findOrFail($memberId);
            $photo = $member->photo;

            $member->forceDelete();
            $this->deletePhoto($photo);
        });
    }

    public function previewStudentAssignment(string $studentIds, ?string $sectionName): array
    {
        $tokens = $this->parseSchoolIds($studentIds);
        $duplicateIds = $tokens->duplicates()->unique()->values();
        $uniqueIds = $tokens->unique()->values();

        if ($uniqueIds->isEmpty()) {
            return $this->emptyAssignmentPreview($sectionName);
        }

        $schoolYear = $this->activeSchoolYearOrFail();
        $students = LibraryMember::query()
            ->where('type', LibraryMember::TYPE_STUDENT)
            ->whereIn('school_id', $uniqueIds->all())
            ->with(['studentEnrollments' => fn ($query) => $query->forSchoolYear($schoolYear->id)])
            ->get()
            ->sortBy(fn (LibraryMember $member): int => $uniqueIds->search($member->school_id))
            ->values();
        $incompleteDetailIds = $students
            ->filter(fn (LibraryMember $member): bool => ! $this->hasCompleteActiveStudentDetails($member, $schoolYear->id))
            ->pluck('school_id')
            ->values();
        $assignableStudents = $students
            ->filter(fn (LibraryMember $member): bool => $this->hasActiveYearLevel($member, $schoolYear->id))
            ->values();

        return [
            'inputCount' => $tokens->count(),
            'uniqueCount' => $uniqueIds->count(),
            'matchedCount' => $students->count(),
            'targetSection' => trim((string) $sectionName) ?: null,
            'memberIds' => $assignableStudents->pluck('id')->values()->all(),
            'matchedStudents' => $students->map(fn (LibraryMember $member): array => $this->assignmentPreviewRow($member, $schoolYear->id))->all(),
            'notFoundIds' => $uniqueIds->diff($students->pluck('school_id'))->values()->all(),
            'duplicateIds' => $duplicateIds->all(),
            'incompleteDetailIds' => $incompleteDetailIds->all(),
        ];
    }

    /**
     * @param  array<int, int>  $memberIds
     */
    public function assignStudents(array $memberIds, ?string $sectionName): int
    {
        $schoolYear = $this->activeSchoolYearOrFail();
        $sectionName = trim((string) $sectionName);

        return DB::transaction(function () use ($schoolYear, $memberIds, $sectionName): int {
            $students = LibraryMember::query()
                ->whereKey($memberIds)
                ->where('type', LibraryMember::TYPE_STUDENT)
                ->with(['studentEnrollments' => fn ($query) => $query->forSchoolYear($schoolYear->id)])
                ->get()
                ->filter(fn (LibraryMember $member): bool => $this->hasActiveYearLevel($member, $schoolYear->id));

            $students->each(function (LibraryMember $member) use ($schoolYear, $sectionName): void {
                $enrollment = $member->studentEnrollments->firstWhere('school_year_id', $schoolYear->id);
                $section = $sectionName !== ''
                    ? $this->sections->findOrCreate($schoolYear->id, $enrollment->year_level, $sectionName)
                    : null;

                $this->assignStudentDetails($member->id, $schoolYear->id, $enrollment->year_level, $section?->id, $section?->name);
            });

            return $students->count();
        });
    }

    private function memberData(array $data): array
    {
        return [
            'rfid_uid' => $data['rfid_uid'],
            'school_id' => $data['school_id'],
            'type' => $data['type'],
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'photo' => $data['photo'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];
    }

    private function storePhoto(?UploadedFile $photo): ?string
    {
        if (! $photo) {
            return null;
        }

        $fileName = Str::uuid()->toString().'.'.$photo->getClientOriginalExtension();
        Storage::disk(self::PHOTO_DISK)->putFileAs('', $photo, $fileName);

        return $fileName;
    }

    private function deletePhoto(?string $fileName): void
    {
        if (! $fileName) {
            return;
        }

        Storage::disk(self::PHOTO_DISK)->delete($fileName);
    }

    private function syncDetails(LibraryMember $member, array $data): void
    {
        if ($data['type'] === LibraryMember::TYPE_STUDENT) {
            $schoolYear = $this->activeSchoolYearOrFail();
            $member->employee()->delete();
            $sectionName = trim((string) ($data['section'] ?? ''));
            $section = $sectionName !== ''
                ? $this->sections->findOrCreate($schoolYear->id, $data['year_level'], $sectionName)
                : null;

            $this->assignStudentDetails($member->id, $schoolYear->id, $data['year_level'], $section?->id, $section?->name);

            return;
        }

        $member->studentEnrollments()->delete();
        $member->employee()->updateOrCreate([], [
            'department' => $data['department'],
        ]);
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

    private function assignStudentDetails(int $memberId, int $schoolYearId, string $yearLevel, ?int $sectionId, ?string $sectionName): void
    {
        LibraryMember::query()
            ->findOrFail($memberId)
            ->studentEnrollments()
            ->updateOrCreate(
                ['school_year_id' => $schoolYearId],
                [
                    'school_year_section_id' => $sectionId,
                    'year_level' => $yearLevel,
                    'section' => $sectionName,
                ],
            );
    }

    /**
     * @return Collection<int, string>
     */
    private function parseSchoolIds(string $studentIds)
    {
        return collect(preg_split('/[\s,;]+/', $studentIds) ?: [])
            ->map(fn (string $value): string => trim($value))
            ->filter()
            ->values();
    }

    private function assignmentPreviewRow(LibraryMember $member, int $schoolYearId): array
    {
        $enrollment = $member->studentEnrollments->firstWhere('school_year_id', $schoolYearId);

        return [
            'id' => $member->id,
            'schoolId' => $member->school_id,
            'name' => $member->full_name,
            'currentYearLevel' => $enrollment?->year_level,
            'currentSection' => $enrollment?->section,
        ];
    }

    private function hasCompleteActiveStudentDetails(LibraryMember $member, int $schoolYearId): bool
    {
        $enrollment = $member->studentEnrollments->firstWhere('school_year_id', $schoolYearId);

        return filled($enrollment?->year_level) && filled($enrollment?->section);
    }

    private function hasActiveYearLevel(LibraryMember $member, int $schoolYearId): bool
    {
        $enrollment = $member->studentEnrollments->firstWhere('school_year_id', $schoolYearId);

        return filled($enrollment?->year_level);
    }

    private function emptyAssignmentPreview(?string $sectionName): array
    {
        return [
            'inputCount' => 0,
            'uniqueCount' => 0,
            'matchedCount' => 0,
            'targetSection' => trim((string) $sectionName) ?: null,
            'memberIds' => [],
            'matchedStudents' => [],
            'notFoundIds' => [],
            'duplicateIds' => [],
            'incompleteDetailIds' => [],
        ];
    }
}
