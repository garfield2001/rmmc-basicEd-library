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

    public function groupedByYearLevel(?int $schoolYearId): array
    {
        if (! $schoolYearId) {
            return [];
        }

        return SchoolYearSection::query()
            ->forSchoolYear($schoolYearId)
            ->select('year_level', 'name')
            ->orderBy('year_level')
            ->orderBy('name')
            ->get()
            ->groupBy('year_level')
            ->map(fn ($sections) => $sections
                ->pluck('name')
                ->filter()
                ->unique()
                ->values()
                ->all())
            ->all();
    }

    public function groupedBySchoolYear(): array
    {
        return SchoolYearSection::query()
            ->orderBy('school_year_id')
            ->orderBy('year_level')
            ->orderBy('name')
            ->get(['school_year_id', 'year_level', 'name'])
            ->groupBy('school_year_id')
            ->map(fn ($schoolYearSections) => $schoolYearSections
                ->groupBy('year_level')
                ->map(fn ($sections) => $sections
                    ->pluck('name')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all())
                ->all())
            ->all();
    }
}
