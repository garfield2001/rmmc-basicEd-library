<?php

namespace App\Support\Reports;

class SimpleVisitReportPdf
{
    private const PAGE_WIDTH = 595;

    private const PAGE_HEIGHT = 842;

    private const LEFT_MARGIN = 40;

    private const TOP_MARGIN = 802;

    private const LINE_HEIGHT = 13;

    private const LINES_PER_PAGE = 55;

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

        $lines = [
            'Library Progress Report',
            $visitorType.' - '.$schoolYear,
            'Period: '.$period,
            '',
            'Visitors: '.$summary['visitors'].
                '    Total visits: '.$summary['total_visits'].
                '    Met required: '.$summary['met_required'].
                '    Overall progress: '.$summary['progress_percent'].'%',
            '',
            sprintf('%-14s %-30s %-22s %8s %10s %-18s', 'School ID', 'Name', 'Group', 'Visits', 'Progress', 'Last visit'),
            str_repeat('-', 110),
        ];

        foreach ($report['rows'] as $row) {
            $group = $row['type'] === 'student'
                ? trim(($row['year_level'] ?? '').' '.($row['section'] ?? ''))
                : ($row['department'] ?? '');

            $lines[] = sprintf(
                '%-14s %-30s %-22s %8s %10s %-18s',
                $this->fit($row['school_id'] ?? '-', 14),
                $this->fit($row['name'] ?? '-', 30),
                $this->fit($group ?: '-', 22),
                (string) $row['visit_count'],
                $row['progress_percent'].'%',
                $this->fit($row['last_visit_at'] ?? '-', 18),
            );
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
        $content = "BT\n/F1 10 Tf\n".self::LINE_HEIGHT." TL\n".self::LEFT_MARGIN.' '.self::TOP_MARGIN." Td\n";

        foreach ($lines as $line) {
            $content .= '('.$this->escapePdfText($line).") Tj\nT*\n";
        }

        return $content.'ET';
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
}
