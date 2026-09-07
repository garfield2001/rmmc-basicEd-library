<?php

namespace App\Services\Library\Imports;

use Illuminate\Support\Str;

class LibraryMemberClassGroupParser
{
    /**
     * @return array{year_level: string, section: string|null}|null
     */
    public function fromText(string $text): ?array
    {
        $tokens = preg_split('/[^\p{L}\p{N}]+/u', strtoupper($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $yearLevel = null;
        $skip = [];

        foreach ($tokens as $index => $token) {
            if (preg_match('/^KD([12])$/', $token, $matches) || preg_match('/^K([12])$/', $token, $matches)) {
                $yearLevel = 'Kindergarten '.$matches[1];
                $skip[$index] = true;

                break;
            }

            if (preg_match('/^G([1-9]|10)$/', $token, $matches)) {
                $yearLevel = 'Grade '.$matches[1];
                $skip[$index] = true;

                break;
            }

            if (in_array($token, ['KINDERGARTEN', 'KINDER', 'KD'], true) && preg_match('/^[12]$/', $tokens[$index + 1] ?? '')) {
                $yearLevel = 'Kindergarten '.$tokens[$index + 1];
                $skip[$index] = true;
                $skip[$index + 1] = true;

                break;
            }

            if ($this->looksLikeGradeToken($token) && preg_match('/^([1-9]|10)$/', $tokens[$index + 1] ?? '')) {
                $yearLevel = 'Grade '.$tokens[$index + 1];
                $skip[$index] = true;
                $skip[$index + 1] = true;

                break;
            }

            if ($index === 0 && preg_match('/^([1-9]|10)$/', $token)) {
                $yearLevel = 'Grade '.$token;
                $skip[$index] = true;

                break;
            }
        }

        $noiseWords = [
            'CLASS', 'LIST', 'WITH', 'LRN', 'SHEET', 'SHEET1', 'SHEET2', 'SHEET3',
            'SHEET4', 'SHEET5', 'SHEET6', 'SHEET7', 'SHEET8', 'SHEET9', 'SHEET10',
            'PAGE', 'STUDENT', 'STUDENTS', 'ROSTER', 'DATA', 'TABLE', 'EXPORT',
            'ENROLLMENT', 'SUMMARY', 'SECTION',
        ];

        $headerWords = [
            'FIRST', 'LAST', 'SURNAME', 'NAME', 'ID', 'SCHOOL', 'MIDDLE', 'DEPARTMENT',
            'PROGRAM', 'STATUS', 'CURRICULUM', 'RELIGION', 'DATE', 'NUMBER', 'NO', 'RFID', 'GENDER',
        ];

        // If no year level was found, check if line contains header words
        if (! $yearLevel) {
            foreach ($tokens as $t) {
                if (in_array($t, $headerWords, true)) {
                    return null;
                }
            }
        }

        $sectionTokens = array_values(array_filter(
            $tokens,
            fn (string $token, int $index): bool => ! isset($skip[$index]) && ! in_array($token, $noiseWords, true) && ! is_numeric($token),
            ARRAY_FILTER_USE_BOTH,
        ));

        // If no year level was found, a standalone section name shouldn't have more than 2 words
        if (! $yearLevel && count($sectionTokens) > 2) {
            return null;
        }

        $section = Str::of(implode(' ', $sectionTokens))->lower()->title()->trim()->toString();
        $section = $section !== '' ? $section : null;

        if (! $yearLevel && ! $section) {
            return null;
        }

        return ['year_level' => $yearLevel, 'section' => $section];
    }

    private function looksLikeGradeToken(string $token): bool
    {
        return $token === 'GRADE' || levenshtein($token, 'GRADE') <= 1;
    }
}
