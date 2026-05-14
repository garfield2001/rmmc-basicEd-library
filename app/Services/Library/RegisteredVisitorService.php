<?php

namespace App\Services\Library;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentRegistration;
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
    private const PHOTO_DISK = 'visitor_photos';

    public function __construct(private readonly SchoolYearSectionService $sections) {}

    public function create(array $data): RegisteredVisitor
    {
        return DB::transaction(function () use ($data): RegisteredVisitor {
            $data['photo'] = $this->storePhoto($data['photo_file'] ?? null);
            $visitor = RegisteredVisitor::create($this->visitorData($data));

            $this->syncDetails($visitor, $data);

            return $visitor->load(['student', 'employee']);
        });
    }

    public function update(RegisteredVisitor $visitor, array $data): RegisteredVisitor
    {
        return DB::transaction(function () use ($visitor, $data): RegisteredVisitor {
            $newPhoto = $this->storePhoto($data['photo_file'] ?? null);

            if ($newPhoto) {
                $this->deletePhoto($visitor->photo);
                $data['photo'] = $newPhoto;
            } else {
                $data['photo'] = $visitor->photo;
            }

            $visitor->update($this->visitorData($data));
            $this->syncDetails($visitor, $data);

            return $visitor->load(['student', 'employee']);
        });
    }

    public function delete(RegisteredVisitor $visitor): void
    {
        DB::transaction(function () use ($visitor): void {
            $visitor->delete();
        });
    }

    /**
     * @param  array<int, int>  $visitorIds
     */
    public function bulkArchive(array $visitorIds): int
    {
        return DB::transaction(fn (): int => RegisteredVisitor::query()
            ->whereIn('id', $visitorIds)
            ->delete());
    }

    public function archiveMatching(Builder $query): int
    {
        return DB::transaction(fn (): int => $query->delete());
    }

    public function restoreArchived(int $visitorId): RegisteredVisitor
    {
        return DB::transaction(function () use ($visitorId): RegisteredVisitor {
            $visitor = RegisteredVisitor::onlyTrashed()->findOrFail($visitorId);
            $visitor->restore();
            $this->restoreStudentToActiveSchoolYear($visitor);

            return $visitor;
        });
    }

    public function permanentlyDeleteArchived(int $visitorId): void
    {
        DB::transaction(function () use ($visitorId): void {
            $visitor = RegisteredVisitor::onlyTrashed()->findOrFail($visitorId);
            $photo = $visitor->photo;

            $visitor->forceDelete();
            $this->deletePhoto($photo);
        });
    }

    /**
     * @param  array<int, int>  $visitorIds
     */
    public function permanentlyDeleteArchivedMany(array $visitorIds): int
    {
        return DB::transaction(function () use ($visitorIds): int {
            $visitors = RegisteredVisitor::onlyTrashed()
                ->whereIn('id', $visitorIds)
                ->get();

            $visitors->each(function (RegisteredVisitor $visitor): void {
                $photo = $visitor->photo;

                $visitor->forceDelete();
                $this->deletePhoto($photo);
            });

            return $visitors->count();
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
            ->with(['studentRegistrations' => fn ($query) => $query->forSchoolYear($schoolYear->id)])
            ->get()
            ->sortBy(fn (RegisteredVisitor $visitor): int => $uniqueIds->search($visitor->school_id))
            ->values();
        $incompleteDetailIds = $students
            ->filter(fn (RegisteredVisitor $visitor): bool => ! $this->hasCompleteActiveStudentDetails($visitor, $schoolYear->id))
            ->pluck('school_id')
            ->values();
        $assignableStudents = $students
            ->filter(fn (RegisteredVisitor $visitor): bool => $this->hasActiveYearLevel($visitor, $schoolYear->id))
            ->values();

        return [
            'inputCount' => $tokens->count(),
            'uniqueCount' => $uniqueIds->count(),
            'matchedCount' => $students->count(),
            'targetSection' => trim((string) $sectionName) ?: null,
            'visitorIds' => $assignableStudents->pluck('id')->values()->all(),
            'matchedStudents' => $students->map(fn (RegisteredVisitor $visitor): array => $this->assignmentPreviewRow($visitor, $schoolYear->id))->all(),
            'notFoundIds' => $uniqueIds->diff($students->pluck('school_id'))->values()->all(),
            'duplicateIds' => $duplicateIds->all(),
            'incompleteDetailIds' => $incompleteDetailIds->all(),
        ];
    }

    /**
     * @param  array<int, int>  $visitorIds
     */
    public function assignStudents(array $visitorIds, ?string $sectionName): int
    {
        $schoolYear = $this->activeSchoolYearOrFail();
        $sectionName = trim((string) $sectionName);

        return DB::transaction(function () use ($schoolYear, $visitorIds, $sectionName): int {
            $students = RegisteredVisitor::query()
                ->whereKey($visitorIds)
                ->where('type', RegisteredVisitor::TYPE_STUDENT)
                ->with(['studentRegistrations' => fn ($query) => $query->forSchoolYear($schoolYear->id)])
                ->get()
                ->filter(fn (RegisteredVisitor $visitor): bool => $this->hasActiveYearLevel($visitor, $schoolYear->id));

            $students->each(function (RegisteredVisitor $visitor) use ($schoolYear, $sectionName): void {
                $studentRegistration = $visitor->studentRegistrations->firstWhere('school_year_id', $schoolYear->id);
                $section = $sectionName !== ''
                    ? $this->sections->findOrCreate($schoolYear->id, $studentRegistration->year_level, $sectionName)
                    : null;

                $this->assignStudentDetails($visitor->id, $schoolYear->id, $studentRegistration->year_level, $section?->id, $section?->name);
            });

            return $students->count();
        });
    }

    private function visitorData(array $data): array
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

    private function syncDetails(RegisteredVisitor $visitor, array $data): void
    {
        if ($data['type'] === RegisteredVisitor::TYPE_STUDENT) {
            $schoolYear = $this->activeSchoolYearOrFail();
            $visitor->employee()->delete();
            $sectionName = trim((string) ($data['section'] ?? ''));
            $section = $sectionName !== ''
                ? $this->sections->findOrCreate($schoolYear->id, $data['year_level'], $sectionName)
                : null;

            $this->assignStudentDetails($visitor->id, $schoolYear->id, $data['year_level'], $section?->id, $section?->name);

            return;
        }

        $visitor->studentRegistrations()->delete();
        $visitor->employee()->updateOrCreate([], [
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

    private function assignStudentDetails(int $visitorId, int $schoolYearId, string $yearLevel, ?int $sectionId, ?string $sectionName): void
    {
        RegisteredVisitor::query()
            ->findOrFail($visitorId)
            ->studentRegistrations()
            ->updateOrCreate(
                ['school_year_id' => $schoolYearId],
                [
                    'school_year_section_id' => $sectionId,
                    'year_level' => $yearLevel,
                    'section' => $sectionName,
                ],
            );
    }

    private function restoreStudentToActiveSchoolYear(RegisteredVisitor $visitor): void
    {
        if ($visitor->type !== RegisteredVisitor::TYPE_STUDENT) {
            return;
        }

        $activeSchoolYear = SchoolYear::active()->first();

        if (! $activeSchoolYear) {
            return;
        }

        $activestudentRegistration = StudentRegistration::withTrashed()
            ->where('registered_visitor_id', $visitor->id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->first();

        if ($activestudentRegistration) {
            $activestudentRegistration->restore();

            return;
        }

        $lateststudentRegistration = StudentRegistration::withTrashed()
            ->where('registered_visitor_id', $visitor->id)
            ->orderByDesc('school_year_id')
            ->first();

        if (! $lateststudentRegistration?->year_level) {
            return;
        }

        StudentRegistration::create([
            'registered_visitor_id' => $visitor->id,
            'school_year_id' => $activeSchoolYear->id,
            'school_year_section_id' => null,
            'year_level' => $lateststudentRegistration->year_level,
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

    private function assignmentPreviewRow(RegisteredVisitor $visitor, int $schoolYearId): array
    {
        $studentRegistration = $visitor->studentRegistrations->firstWhere('school_year_id', $schoolYearId);

        return [
            'id' => $visitor->id,
            'schoolId' => $visitor->school_id,
            'name' => $visitor->full_name,
            'currentYearLevel' => $studentRegistration?->year_level,
            'currentSection' => $studentRegistration?->section,
        ];
    }

    private function hasCompleteActiveStudentDetails(RegisteredVisitor $visitor, int $schoolYearId): bool
    {
        $studentRegistration = $visitor->studentRegistrations->firstWhere('school_year_id', $schoolYearId);

        return filled($studentRegistration?->year_level) && filled($studentRegistration?->section);
    }

    private function hasActiveYearLevel(RegisteredVisitor $visitor, int $schoolYearId): bool
    {
        $studentRegistration = $visitor->studentRegistrations->firstWhere('school_year_id', $schoolYearId);

        return filled($studentRegistration?->year_level);
    }

    private function emptyAssignmentPreview(?string $sectionName): array
    {
        return [
            'inputCount' => 0,
            'uniqueCount' => 0,
            'matchedCount' => 0,
            'targetSection' => trim((string) $sectionName) ?: null,
            'visitorIds' => [],
            'matchedStudents' => [],
            'notFoundIds' => [],
            'duplicateIds' => [],
            'incompleteDetailIds' => [],
        ];
    }
}
