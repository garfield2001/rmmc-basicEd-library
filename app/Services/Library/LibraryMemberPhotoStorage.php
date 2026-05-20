<?php

namespace App\Services\Library;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LibraryMemberPhotoStorage
{
    private const PHOTO_DISK = 'visitor_photos';

    public function store(?UploadedFile $photo): ?string
    {
        if (! $photo) {
            return null;
        }

        $fileName = Str::uuid()->toString().'.'.$photo->getClientOriginalExtension();
        Storage::disk(self::PHOTO_DISK)->putFileAs('', $photo, $fileName);

        return $fileName;
    }

    public function delete(?string $fileName): void
    {
        if ($fileName) {
            Storage::disk(self::PHOTO_DISK)->delete($fileName);
        }
    }
}
