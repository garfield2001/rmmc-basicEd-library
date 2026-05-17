<?php

namespace App\Support\Reports;

use App\Support\Academics\AcademicLevels;

class SimpleVisitReportPdf
{
    private const PAGE_WIDTH = 792;

    private const PAGE_HEIGHT = 612;

    private const LEFT_MARGIN = 36;

    private const TOP_MARGIN = 568;

    private const LINE_HEIGHT = 15;

    private const LINES_PER_PAGE = 35;

    private const TABLE_WIDTH = 720;

    public function make(array $report): string
    {
        $lines = $this->reportLines($report);
        $pages = array_chunk($lines, self::LINES_PER_PAGE);

        return $this->buildPdf($pages);
    }

    private function reportLines(array $report): array
    {
        $schoolYear = $report['school_year']['name'] ?? 'No school year';
        $visitorType = ucfirst((string) ($report['summary']['visitor_type'] ?? 'visitor')).'s';
        $period = ($report['filters']['start_date'] ?? '').' to '.($report['filters']['end_date'] ?? '');
        $summary = $report['summary'];
        $isStudent = ($summary['visitor_type'] ?? null) === 'student';
        $groupHeader = $isStudent ? 'Year/section' : 'Department';

        $lines = [
            $this->line('Library Progress Report', 'title'),
            $this->line('School year: '.$schoolYear.'    Visitor type: '.$visitorType),
            $this->line('From '.$period),
            $this->line(''),
            $this->line('Visitors: '.$summary['visitors'].
                '    Total visits: '.$summary['total_visits'].
                '    Required visits: '.$summary['required_visits']),
            $this->line(''),
            $this->line(sprintf('%-13s  %-28s  %-22s  %-9s  %-6s  %-8s', 'School ID', 'Name', $groupHeader, 'Visits', 'Excess', 'Progress'), 'tableHeader'),
        ];

        foreach ($report['rows'] as $rowIndex => $row) {
            $group = $isStudent
                ? ($row['year_section_label'] ?? trim(collect([AcademicLevels::shortLabel($row['year_level'] ?? null), $row['section'] ?? null])->filter()->implode(' - ')))
                : ($row['department'] ?? '');

            $lines[] = $this->line(sprintf(
                '%-13s  %-28s  %-22s  %-9s  %-6s  %-8s',
                $this->fit($row['school_id'] ?? '-', 13),
                $this->fit($row['name'] ?? '-', 28),
                $this->fit($group ?: '-', 22),
                $this->fit($row['visit_count'].' / '.$summary['required_visits'], 9),
                (string) ($row['excess_visits'] ?? 0),
                $row['progress_percent'].'%',
            ), 'tableRow', $rowIndex);
        }

        return $lines;
    }

    private function buildPdf(array $pages): string
    {
        $objects = [];
        $pageIds = [];
        $nextId = 3;
        $fontId = 3 + (count($pages) * 2);

        foreach ($pages as $pageLines) {
            $pageId = $nextId++;
            $contentId = $nextId++;
            $pageIds[] = $pageId;

            $content = $this->pageContent($pageLines);
            $objects[$pageId] = sprintf(
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] /Resources << /Font << /F1 %d 0 R >> >> /Contents %d 0 R >>',
                self::PAGE_WIDTH,
                self::PAGE_HEIGHT,
                $fontId,
                $contentId,
            );
            $objects[$contentId] = '<< /Length '.strlen($content)." >>\nstream\n".$content."\nendstream";
        }

        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', array_map(fn (int $id): string => $id.' 0 R', $pageIds)).'] /Count '.count($pageIds).' >>';
        $objects[$fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>';
        ksort($objects);

        return $this->serializePdf($objects);
    }

    private function pageContent(array $lines): string
    {
        $content = '';
        $y = self::TOP_MARGIN;

        foreach ($lines as $line) {
            $kind = $line['kind'] ?? 'body';
            $fontSize = $kind === 'title' ? 18 : 12;
            $lineHeight = $kind === 'title' ? 22 : self::LINE_HEIGHT;

            if ($kind === 'tableHeader') {
                $content .= $this->fillRect(self::LEFT_MARGIN - 4, $y - 4, self::TABLE_WIDTH + 8, self::LINE_HEIGHT, [0.91, 0.94, 0.99]);
            }

            if ($kind === 'tableRow') {
                $rowIndex = (int) ($line['rowIndex'] ?? 0);
                $color = $rowIndex % 2 === 0 ? [1, 1, 1] : [0.97, 0.98, 0.99];
                $content .= $this->fillRect(self::LEFT_MARGIN - 4, $y - 4, self::TABLE_WIDTH + 8, self::LINE_HEIGHT, $color);
            }

            $content .= "BT\n0 0 0 rg\n/F1 {$fontSize} Tf\n".self::LEFT_MARGIN.' '.$y.' Td\n('.$this->escapePdfText($line['text']).") Tj\nET\n";
            $y -= $lineHeight;
        }

        return $content;
    }

    private function serializePdf(array $objects): string
    {
        $pdf = "%PDF-1.4\n";
        $offsets = [0 => 0];

        foreach ($objects as $id => $object) {
            $offsets[$id] = strlen($pdf);
            $pdf .= $id." 0 obj\n".$object."\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        for ($id = 1; $id <= count($objects); $id++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
        }

        $pdf .= "trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\n";
        $pdf .= "startxref\n".$xrefOffset."\n%%EOF";

        return $pdf;
    }

    private function escapePdfText(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\(', '\)'], $value);
    }

    private function fit(string $value, int $width): string
    {
        $value = preg_replace('/\s+/', ' ', trim($value)) ?? '';

        if (strlen($value) <= $width) {
            return $value;
        }

        return substr($value, 0, max(0, $width - 3)).'...';
    }

    private function line(string $text, string $kind = 'body', ?int $rowIndex = null): array
    {
        return array_filter([
            'text' => $text,
            'kind' => $kind,
            'rowIndex' => $rowIndex,
        ], fn ($value): bool => $value !== null);
    }

    /**
     * @param  array{0: float|int, 1: float|int, 2: float|int}  $rgb
     */
    private function fillRect(float $x, float $y, float $width, float $height, array $rgb): string
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
}
