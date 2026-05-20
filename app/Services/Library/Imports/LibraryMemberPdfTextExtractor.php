<?php

namespace App\Services\Library\Imports;

class LibraryMemberPdfTextExtractor
{
    /**
     * @return array<int, string>
     */
    public function lines(string $content): array
    {
        $text = '';
        preg_match_all('/<<(.*?)>>\s*stream\s*(.*?)\s*endstream/s', $content, $streams, PREG_SET_ORDER);

        foreach ($streams as $stream) {
            $text .= "\n".$this->streamText($stream[1], $stream[2]);
        }

        return collect(preg_split('/\R+/', $text) ?: [])
            ->map(fn (string $line) => trim(preg_replace('/[\x{00A0}]+/u', ' ', $line) ?: ''))
            ->filter()
            ->values()
            ->all();
    }

    private function streamText(string $dictionary, string $data): string
    {
        $data = preg_replace('/^\r?\n|\r?\n$/', '', $data) ?? '';

        if (str_contains($dictionary, '/FlateDecode')) {
            $inflated = @gzuncompress($data);
            $data = is_string($inflated) ? $inflated : $data;
        }

        return $this->contentText($data);
    }

    private function contentText(string $stream): string
    {
        $text = '';
        preg_match_all('/\[(.*?)\]\s*TJ|\((?:\\\\.|[^\\\\()])*\)\s*Tj|<([0-9A-Fa-f\s]+)>\s*Tj|T\*|\'|"/s', $stream, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $token = $match[0];

            if (in_array($token, ['T*', "'", '"'], true)) {
                $text .= "\n";
            } elseif (str_ends_with($token, 'TJ')) {
                $text .= $this->arrayText($match[1] ?? '')."\n";
            } elseif (preg_match('/\((?:\\\\.|[^\\\\()])*\)\s*Tj/s', $token, $stringMatch)) {
                $text .= $this->literalText($stringMatch[0])."\n";
            } elseif (($match[2] ?? '') !== '') {
                $text .= $this->hexText($match[2])."\n";
            }
        }

        return $text;
    }

    private function arrayText(string $array): string
    {
        $text = '';
        preg_match_all('/\((?:\\\\.|[^\\\\()])*\)|<([0-9A-Fa-f\s]+)>/', $array, $parts);

        foreach ($parts[0] as $part) {
            $text .= str_starts_with($part, '<') ? $this->hexText($part) : $this->literalText($part);
        }

        return $text;
    }

    private function literalText(string $literal): string
    {
        $literal = preg_replace('/\s*Tj$/', '', $literal) ?? $literal;
        $literal = preg_replace('/^\(|\)$/', '', trim($literal)) ?? $literal;

        return stripcslashes($literal);
    }

    private function hexText(string $hex): string
    {
        $hex = preg_replace('/[^0-9A-Fa-f]/', '', trim($hex, '<>')) ?? '';
        $binary = $hex !== '' ? hex2bin(strlen($hex) % 2 === 0 ? $hex : '0'.$hex) : false;

        if (! is_string($binary)) {
            return '';
        }

        $utf16 = function_exists('mb_convert_encoding') ? @mb_convert_encoding($binary, 'UTF-8', 'UTF-16BE') : false;

        return is_string($utf16) && preg_match('/[[:print:]]/', $utf16) ? $utf16 : $binary;
    }
}
