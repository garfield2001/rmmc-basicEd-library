<?php

namespace App\Services\Library;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Services\SchoolYears\SchoolYearSectionService;
use Illuminate\Http\UploadedFile;
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
            $photo = $member->photo;
            $member->delete();
            $this->deletePhoto($photo);
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
            $schoolYear = SchoolYear::active()->first();

            if (! $schoolYear) {
                throw ValidationException::withMessages([
                    'year_level' => 'Create or activate a school year before assigning student year level and section.',
                ]);
            }

            $member->employee()->delete();
            $section = $this->sections->findOrCreate($schoolYear->id, $data['year_level'], $data['section']);
            $member->studentEnrollments()
                ->updateOrCreate(
                    ['school_year_id' => $schoolYear->id],
                    [
                        'school_year_section_id' => $section->id,
                        'year_level' => $data['year_level'],
                        'section' => $section->name,
                        'status' => $data['enrollment_status'] ?? 'enrolled',
                    ],
                );

            return;
        }

        $member->studentEnrollments()->delete();
        $member->employee()->updateOrCreate([], [
            'department' => $data['department'],
        ]);
    }
}
