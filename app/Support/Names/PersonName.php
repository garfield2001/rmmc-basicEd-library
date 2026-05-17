<?php

namespace App\Support\Names;

class PersonName
{
    public static function part(?string $value): ?string
    {
        $value = trim(preg_replace('/\s+/', ' ', (string) $value) ?: '');

        if ($value === '') {
            return null;
        }

        return collect(explode(' ', mb_strtolower($value)))
            ->map(fn (string $word): string => self::capitalizeCompoundWord($word))
            ->implode(' ');
    }

    public static function requiredPart(?string $value): string
    {
        return self::part($value) ?? '';
    }

    private static function capitalizeCompoundWord(string $word): string
    {
        return preg_replace_callback(
            '/(^|[-\'])([[:alpha:]])/u',
            fn (array $matches): string => $matches[1].mb_strtoupper($matches[2]),
            $word,
        ) ?? $word;
    }
}
