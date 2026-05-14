<?php

namespace App\Services\Library;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Services\SchoolYears\SchoolYearSectionService;
use Illuminate\Http\UploadedFile;
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
            $data['rfid_uid'] = $visitor->rfid_uid;
            $data['school_id'] = $visitor->school_id;
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
            $sectionName = trim((string) ($data['section'] ?? ''));
            $section = $sectionName !== ''
                ? $this->sections->findOrCreate($schoolYear->id, $data['year_level'], $sectionName)
                : null;

            $this->assignStudentDetails($visitor->id, $schoolYear->id, $data['year_level'], $section?->id, $section?->name);

            return;
        }

        $schoolYear = $this->activeSchoolYearOrFail();
        $visitor->employeeProfiles()->updateOrCreate(
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

    private function assignStudentDetails(int $visitorId, int $schoolYearId, string $yearLevel, ?int $sectionId, ?string $sectionName): void
    {
        $visitor = RegisteredVisitor::query()->findOrFail($visitorId);

        $visitor->studentRegistrations()->updateOrCreate(
            ['school_year_id' => $schoolYearId],
            $this->visitorSnapshot($visitor) + [
                'school_year_section_id' => $sectionId,
                'year_level' => $yearLevel,
                'section' => $sectionName,
            ],
        );
    }

    private function visitorSnapshot(RegisteredVisitor $visitor): array
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
