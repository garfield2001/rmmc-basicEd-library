<?php

namespace App\Services\Library;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Services\SchoolYears\SchoolYearSectionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegisteredVisitorService
{
    private const PHOTO_DISK = 'member_photos';

    public function __construct(private readonly SchoolYearSectionService $sections) {}

    public function create(array $data): RegisteredVisitor
    {
        return DB::transaction(function () use ($data): RegisteredVisitor {
            $data['photo'] = $this->storePhoto($data['photo_file'] ?? null);
            $member = RegisteredVisitor::create($this->memberData($data));

            $this->syncDetails($member, $data);

            return $member->load(['student', 'employee']);
        });
    }

    public function update(RegisteredVisitor $member, array $data): RegisteredVisitor
    {
        return DB::transaction(function () use ($member, $data): RegisteredVisitor {
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

    public function delete(RegisteredVisitor $member): void
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
        return DB::transaction(fn (): int => RegisteredVisitor::query()
            ->whereIn('id', $memberIds)
            ->delete());
    }

    public function archiveMatching(Builder $query): int
    {
        return DB::transaction(fn (): int => $query->delete());
    }

    public function restoreArchived(int $memberId): RegisteredVisitor
    {
        return DB::transaction(function () use ($memberId): RegisteredVisitor {
            $member = RegisteredVisitor::onlyTrashed()->findOrFail($memberId);
            $member->restore();
            $this->restoreStudentToActiveSchoolYear($member);

            return $member;
        });
    }

    public function permanentlyDeleteArchived(int $memberId): void
    {
        DB::transaction(function () use ($memberId): void {
            $member = RegisteredVisitor::onlyTrashed()->findOrFail($memberId);
            $photo = $member->photo;

            $member->forceDelete();
            $this->deletePhoto($photo);
        });
    }

    /**
     * @param  array<int, int>  $memberIds
     */
    public function permanentlyDeleteArchivedMany(array $memberIds): int
    {
        return DB::transaction(function () use ($memberIds): int {
            $members = RegisteredVisitor::onlyTrashed()
                ->whereIn('id', $memberIds)
                ->get();

            $members->each(function (RegisteredVisitor $member): void {
                $photo = $member->photo;

                $member->forceDelete();
                $this->deletePhoto($photo);
            });

            return $members->count();
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
        $students = RegisteredVisitor::query()
            ->where('type', RegisteredVisitor::TYPE_STUDENT)
            ->whereIn('school_id', $uniqueIds->all())
            ->with(['studentSchoolYearRecords' => fn ($query) => $query->forSchoolYear($schoolYear->id)])
            ->get()
            ->sortBy(fn (RegisteredVisitor $member): int => $uniqueIds->search($member->school_id))
            ->values();
        $incompleteDetailIds = $students
            ->filter(fn (RegisteredVisitor $member): bool => ! $this->hasCompleteActiveStudentDetails($member, $schoolYear->id))
            ->pluck('school_id')
            ->values();
        $assignableStudents = $students
            ->filter(fn (RegisteredVisitor $member): bool => $this->hasActiveYearLevel($member, $schoolYear->id))
            ->values();

        return [
            'inputCount' => $tokens->count(),
            'uniqueCount' => $uniqueIds->count(),
            'matchedCount' => $students->count(),
            'targetSection' => trim((string) $sectionName) ?: null,
            'memberIds' => $assignableStudents->pluck('id')->values()->all(),
            'matchedStudents' => $students->map(fn (RegisteredVisitor $member): array => $this->assignmentPreviewRow($member, $schoolYear->id))->all(),
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
            $students = RegisteredVisitor::query()
                ->whereKey($memberIds)
                ->where('type', RegisteredVisitor::TYPE_STUDENT)
                ->with(['studentSchoolYearRecords' => fn ($query) => $query->forSchoolYear($schoolYear->id)])
                ->get()
                ->filter(fn (RegisteredVisitor $member): bool => $this->hasActiveYearLevel($member, $schoolYear->id));

            $students->each(function (RegisteredVisitor $member) use ($schoolYear, $sectionName): void {
                $studentRecord = $member->studentSchoolYearRecords->firstWhere('school_year_id', $schoolYear->id);
                $section = $sectionName !== ''
                    ? $this->sections->findOrCreate($schoolYear->id, $studentRecord->year_level, $sectionName)
                    : null;

                $this->assignStudentDetails($member->id, $schoolYear->id, $studentRecord->year_level, $section?->id, $section?->name);
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

    private function syncDetails(RegisteredVisitor $member, array $data): void
    {
        if ($data['type'] === RegisteredVisitor::TYPE_STUDENT) {
            $schoolYear = $this->activeSchoolYearOrFail();
            $member->employee()->delete();
            $sectionName = trim((string) ($data['section'] ?? ''));
            $section = $sectionName !== ''
                ? $this->sections->findOrCreate($schoolYear->id, $data['year_level'], $sectionName)
                : null;

            $this->assignStudentDetails($member->id, $schoolYear->id, $data['year_level'], $section?->id, $section?->name);

            return;
        }

        $member->studentSchoolYearRecords()->delete();
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
        RegisteredVisitor::query()
            ->findOrFail($memberId)
            ->studentSchoolYearRecords()
            ->updateOrCreate(
                ['school_year_id' => $schoolYearId],
                [
                    'school_year_section_id' => $sectionId,
                    'year_level' => $yearLevel,
                    'section' => $sectionName,
                ],
            );
    }

    private function restoreStudentToActiveSchoolYear(RegisteredVisitor $member): void
    {
        if ($member->type !== RegisteredVisitor::TYPE_STUDENT) {
            return;
        }

        $activeSchoolYear = SchoolYear::active()->first();

        if (! $activeSchoolYear) {
            return;
        }

        $activeStudentRecord = StudentSchoolYearRecord::withTrashed()
            ->where('registered_visitor_id', $member->id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->first();

        if ($activeStudentRecord) {
            $activeStudentRecord->restore();

            return;
        }

        $latestStudentRecord = StudentSchoolYearRecord::withTrashed()
            ->where('registered_visitor_id', $member->id)
            ->orderByDesc('school_year_id')
            ->first();

        if (! $latestStudentRecord?->year_level) {
            return;
        }

        StudentSchoolYearRecord::create([
            'registered_visitor_id' => $member->id,
            'school_year_id' => $activeSchoolYear->id,
            'school_year_section_id' => null,
            'year_level' => $latestStudentRecord->year_level,
            'section' => null,
        ]);
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

    private function assignmentPreviewRow(RegisteredVisitor $member, int $schoolYearId): array
    {
        $studentRecord = $member->studentSchoolYearRecords->firstWhere('school_year_id', $schoolYearId);

        return [
            'id' => $member->id,
            'schoolId' => $member->school_id,
            'name' => $member->full_name,
            'currentYearLevel' => $studentRecord?->year_level,
            'currentSection' => $studentRecord?->section,
        ];
    }

    private function hasCompleteActiveStudentDetails(RegisteredVisitor $member, int $schoolYearId): bool
    {
        $studentRecord = $member->studentSchoolYearRecords->firstWhere('school_year_id', $schoolYearId);

        return filled($studentRecord?->year_level) && filled($studentRecord?->section);
    }

    private function hasActiveYearLevel(RegisteredVisitor $member, int $schoolYearId): bool
    {
        $studentRecord = $member->studentSchoolYearRecords->firstWhere('school_year_id', $schoolYearId);

        return filled($studentRecord?->year_level);
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
