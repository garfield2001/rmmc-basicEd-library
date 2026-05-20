<?php

namespace App\Support\Reports;

use Carbon\Carbon;

class SimpleVisitReportPdf
{
    private const TABLE_TOP = 548;

    private const GROUP_HEIGHT = 24;

    public function __construct(
        private readonly PdfCanvas $canvas,
        private readonly PdfDocument $document,
        private readonly VisitReportPdfPaginator $paginator,
        private readonly VisitReportPdfTable $table,
    ) {}

    public function make(array $report): string
    {
        $pages = $this->paginator->pages($report);

        return $this->document->build(
            $pages,
            fn (array $items, int $page, int $pageCount): string => $this->pageContent($report, $items, $page, $pageCount),
        );
    }

    private function pageContent(array $report, array $items, int $page, int $pages): string
    {
        $summary = $report['summary'];
        $content = $this->reportHeader($report, $page, $pages);
        $y = self::TABLE_TOP;

        if ($items === []) {
            return $content.$this->canvas->text(272, 330, 'No records match the selected report filters.', 12, 'F2', [0.07, 0.09, 0.17]);
        }

        foreach ($items as $item) {
            if ($item['type'] === 'group') {
                $content .= $this->canvas->centerText(306, $y, $item['label'], 11, 'F2', [0.01, 0.02, 0.25]);
                $y -= self::GROUP_HEIGHT;
            } elseif ($item['type'] === 'header') {
                $content .= $this->table->header($y);
                $y -= VisitReportPdfTable::ROW_HEIGHT;
            } elseif ($item['type'] === 'summary') {
                $content .= $this->canvas->centerText(306, $y, $item['text'], 10.5, 'F2', [0.07, 0.09, 0.17]);
                $y -= self::GROUP_HEIGHT;
            } else {
                $content .= $this->table->row($summary, $item['row'], $y, $item['stripe']);
                $y -= VisitReportPdfTable::ROW_HEIGHT;
            }
        }

        return $content;
    }

    private function reportHeader(array $report, int $page, int $pages): string
    {
        $summary = $report['summary'];
        $visitorType = ucfirst((string) ($summary['visitor_type'] ?? 'visitor'));
        $schoolYear = $report['school_year']['name'] ?? 'No school year';
        $fromDate = $this->formatDate($report['filters']['start_date'] ?? '');
        $toDate = $this->formatDate($report['filters']['end_date'] ?? '');
        $content = '';

        $content .= $this->canvas->centerText(306, 724, 'RAMON MAGSAYSAY MEMORIAL', 14.5, 'F2', [0, 0, 0]);
        $content .= $this->canvas->centerText(306, 704, 'COLLEGES INTEGRATED SCHOOL', 14.5, 'F2', [0, 0, 0]);
        $content .= $this->canvas->centerText(306, 684, 'Ventilation St., Lagao, General Santos City, Philippines', 10, 'F1', [0, 0, 0]);
        $content .= $this->canvas->centerText(306, 670, 'rmmcbep@gmail.com / +639518240218', 10, 'F1', [0, 0, 0.55]);
        $content .= $this->canvas->centerText(306, 634, 'Library Progress Report', 18, 'F2', [0.01, 0.02, 0.25]);
        $content .= $this->metadataRow(608, 'School Year:', $schoolYear, 'Visitor Type:', $visitorType);
        $content .= $this->metadataRow(590, 'From:', $fromDate, 'To:', $toDate);
        $content .= $this->canvas->text(524, 28, "Page {$page} of {$pages}", 9, 'F1', [0.39, 0.45, 0.55]);

        return $content;
    }

    private function metadataRow(float $y, string $leftLabel, string $leftValue, string $rightLabel, string $rightValue): string
    {
        $gap = 24;
        $leftLabelWidth = $this->canvas->textWidth($leftLabel.' ', 12);
        $leftValueWidth = $this->canvas->textWidth($leftValue, 12);
        $rightLabelWidth = $this->canvas->textWidth($rightLabel.' ', 12);
        $totalWidth = $leftLabelWidth + $leftValueWidth + $gap + $rightLabelWidth + $this->canvas->textWidth($rightValue, 12);
        $x = 306 - ($totalWidth / 2);

        return $this->canvas->text($x, $y, $leftLabel.' ', 12, 'F2', [0, 0, 0])
            .$this->canvas->text($x + $leftLabelWidth, $y, $leftValue, 12, 'F1', [0.07, 0.09, 0.17])
            .$this->canvas->text($x + $leftLabelWidth + $leftValueWidth + $gap, $y, $rightLabel.' ', 12, 'F2', [0, 0, 0])
            .$this->canvas->text($x + $leftLabelWidth + $leftValueWidth + $gap + $rightLabelWidth, $y, $rightValue, 12, 'F1', [0.07, 0.09, 0.17]);
    }

    private function formatDate(string $value): string
    {
        return $value === '' ? '' : Carbon::parse($value)->format('F j, Y');
    }
}
