<?php

namespace App\Services\SchoolYears;

use App\Models\SchoolYearSection;

class SchoolYearSectionService
{
    public function findOrCreate(int $schoolYearId, string $yearLevel, string $section): SchoolYearSection
    {
        return SchoolYearSection::query()->firstOrCreate(
            [
                'school_year_id' => $schoolYearId,
                'year_level' => $yearLevel,
                'name' => trim($section),
            ],
        );
    }
}
