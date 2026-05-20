<?php

namespace App\Support\Reports;

use App\Support\Academics\AcademicLevels;

class VisitReportPdfTable
{
    public const ROW_HEIGHT = 20;

    private const MARGIN = 70;

    private const TABLE_WIDTH = 472;

    public function __construct(private readonly PdfCanvas $canvas) {}

    public function header(float $y): string
    {
        $content = $this->canvas->fillRect(self::MARGIN, $y - 15, self::TABLE_WIDTH, self::ROW_HEIGHT, [0.91, 0.94, 0.99]);
        $x = self::MARGIN;

        foreach ($this->columns() as $column) {
            $content .= $this->canvas->strokeRect($x, $y - 15, $column['width'], self::ROW_HEIGHT, [0.82, 0.85, 0.91]);
            $content .= $this->canvas->text($x + 5, $y - 8, $column['label'], 9.5, 'F2', [0.07, 0.09, 0.17]);
            $x += $column['width'];
        }

        return $content;
    }

    public function row(array $summary, array $row, float $y, int $rowIndex): string
    {
        $color = $rowIndex % 2 === 0 ? [1, 1, 1] : [0.97, 0.98, 1];
        $content = $this->canvas->fillRect(self::MARGIN, $y - 15, self::TABLE_WIDTH, self::ROW_HEIGHT, $color);
        $x = self::MARGIN;

        foreach ($this->columns() as $column) {
            $text = $this->cellValue($column['key'], $row, $summary);
            $content .= $this->canvas->strokeRect($x, $y - 15, $column['width'], self::ROW_HEIGHT, [0.86, 0.88, 0.92]);
            $content .= $this->canvas->text($x + 5, $y - 8, $this->canvas->fit($text, $column['width'], 9.2), 9.2, 'F1', [0.07, 0.09, 0.17]);
            $x += $column['width'];
        }

        return $content;
    }

    private function columns(): array
    {
        return [
            ['key' => 'school_id', 'label' => 'School ID', 'width' => 76],
            ['key' => 'name', 'label' => 'Name', 'width' => 241],
            ['key' => 'visits', 'label' => 'Visits', 'width' => 47],
            ['key' => 'excess_visits', 'label' => 'Excess', 'width' => 50],
            ['key' => 'progress', 'label' => 'Progress', 'width' => 58],
        ];
    }

    private function cellValue(string $key, array $row, array $summary): string
    {
        return match ($key) {
            'school_id' => (string) ($row['school_id'] ?? '-'),
            'name' => (string) ($row['name'] ?? '-'),
            'year_section' => (string) (($row['year_section_label'] ?? trim(collect([AcademicLevels::shortLabel($row['year_level'] ?? null), $row['section'] ?? null])->filter()->implode(' - '))) ?: '-'),
            'department' => (string) (($row['department'] ?? '') ?: '-'),
            'visits' => ($row['visit_count'] ?? 0).' / '.($summary['required_visits'] ?? 0),
            'excess_visits' => (string) ($row['excess_visits'] ?? 0),
            'progress' => ($row['progress_percent'] ?? 0).'%',
            default => '',
        };
    }
}
