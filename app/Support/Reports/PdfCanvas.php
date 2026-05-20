<?php

namespace App\Support\Reports;

class PdfCanvas
{
    public function text(float $x, float $y, string $value, float $size, string $font, array $rgb): string
    {
        $value = $this->pdfSafeText($value);

        return sprintf(
            "BT\n%.3F %.3F %.3F rg\n/%s %.1F Tf\n%.2F %.2F Td\n(%s) Tj\nET\n",
            $rgb[0],
            $rgb[1],
            $rgb[2],
            $font,
            $size,
            $x,
            $y,
            $this->escapePdfText($value),
        );
    }

    public function centerText(float $centerX, float $y, string $value, float $size, string $font, array $rgb): string
    {
        return $this->text($centerX - ($this->textWidth($value, $size) / 2), $y, $value, $size, $font, $rgb);
    }

    public function textWidth(string $value, float $size): float
    {
        $width = 0;

        foreach (str_split($this->pdfSafeText($value)) as $character) {
            $width += match (true) {
                $character === ' ' => 0.28,
                in_array($character, ['I', 'i', 'l', '.', ',', ':', ';', "'", '!'], true) => 0.28,
                in_array($character, ['M', 'W', 'm', 'w'], true) => 0.82,
                ctype_upper($character) => 0.64,
                ctype_digit($character) => 0.56,
                default => 0.52,
            };
        }

        return $width * $size;
    }

    public function fillRect(float $x, float $y, float $width, float $height, array $rgb): string
    {
        return sprintf(
            "q\n%.3F %.3F %.3F rg\n%.2F %.2F %.2F %.2F re f\nQ\n",
            $rgb[0],
            $rgb[1],
            $rgb[2],
            $x,
            $y,
            $width,
            $height,
        );
    }

    public function strokeRect(float $x, float $y, float $width, float $height, array $rgb): string
    {
        return sprintf(
            "q\n%.3F %.3F %.3F RG\n0.5 w\n%.2F %.2F %.2F %.2F re S\nQ\n",
            $rgb[0],
            $rgb[1],
            $rgb[2],
            $x,
            $y,
            $width,
            $height,
        );
    }

    public function fit(string $value, float $width, float $fontSize): string
    {
        $value = preg_replace('/\s+/', ' ', trim($value)) ?? '';
        $maxCharacters = max(4, (int) floor($width / ($fontSize * 0.52)));

        return mb_strlen($value) <= $maxCharacters
            ? $value
            : mb_substr($value, 0, $maxCharacters - 3).'...';
    }

    private function escapePdfText(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\(', '\)'], $value);
    }

    private function pdfSafeText(string $value): string
    {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);

        return is_string($converted) ? $converted : $value;
    }
}
