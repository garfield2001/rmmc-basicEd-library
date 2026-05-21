<?php

namespace App\Support\Academics;

class AcademicLevels
{
    /**
     * @return array<int, string>
     */
    public static function options(): array
    {
        return [
            'Kindergarten 1',
            'Kindergarten 2',
            'Grade 1',
            'Grade 2',
            'Grade 3',
            'Grade 4',
            'Grade 5',
            'Grade 6',
            'Grade 7',
            'Grade 8',
            'Grade 9',
            'Grade 10',
        ];
    }

    public static function rank(?string $yearLevel): ?int
    {
        $rank = array_search($yearLevel, self::options(), true);

        return $rank === false ? null : $rank;
    }

    public static function isDemotion(?string $sourceYearLevel, string $targetYearLevel): bool
    {
        $sourceRank = self::rank($sourceYearLevel);
        $targetRank = self::rank($targetYearLevel);

        return $sourceRank !== null && $targetRank !== null && $targetRank < $sourceRank;
    }

    public static function nextAfter(?string $yearLevel): ?string
    {
        $rank = self::rank($yearLevel);

        if ($rank === null) {
            return null;
        }

        return self::options()[$rank + 1] ?? null;
    }

}
