<?php

namespace App\Exports\Reports;

use App\Services\Reports\VisitReportExportService;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class VisitReportExcelExport implements FromArray, WithColumnFormatting, WithColumnWidths, WithDrawings, WithEvents, WithStrictNullComparison, WithTitle
{
    private array $headerRows = [];

    private array $tableRanges = [];

    private array $groupTitleRows = [];

    private array $summaryHeaderRows = [];

    private array $summaryTableRanges = [];

    public function __construct(private readonly array $report, private readonly array $groups) {}

    public function array(): array
    {
        $rows = $this->titleRows();

        foreach ($this->groups as $group) {
            $rows[] = ['', '', '', '', ''];
            $rows[] = [$this->groupPrefix().': '.$group['label']];
            $this->groupTitleRows[] = count($rows);
            $rows[] = ['School ID', 'Name', 'Visits', 'Excess', 'Progress'];
            $this->headerRows[] = count($rows);
            $tableStart = count($rows);

            foreach ($group['rows'] as $index => $row) {
                $rows[] = [
                    (string) ($row['school_id'] ?? ''),
                    (string) ($row['name'] ?? ''),
                    ((int) ($row['visit_count'] ?? 0)).' / '.$this->requiredVisits(),
                    (int) ($row['excess_visits'] ?? 0),
                    ((int) ($row['progress_percent'] ?? 0)).'%',
                ];
            }

            $this->tableRanges[] = [$tableStart, count($rows)];
        }

        $overallVisits = max(1, collect($this->report['rows'])->sum('visit_count'));
        $comparison = (new VisitReportExportService)->comparison($this->groups, $overallVisits);

        $topVisits = $comparison['top_by_visits'] ?? [];
        $topCompletion = $comparison['top_by_completion'] ?? [];

        if (count($topVisits) > 1) {
            $prefix = $this->groupPrefix();

            // Subsection 1: Highest Total Visits
            $rows[] = ['', '', '', '', ''];
            $rows[] = ["Analysis Summary: Top {$prefix}s by Total Visits", '', '', '', ''];
            $this->groupTitleRows[] = count($rows);
            $rows[] = ['Rank', $prefix, 'Total Visits', 'Visit Share (%)', 'Average Visits'];
            $this->headerRows[] = count($rows);
            $tableStart = count($rows);

            foreach ($topVisits as $index => $comp) {
                $rows[] = [
                    '#'.($index + 1),
                    (string) $comp['label'],
                    (int) $comp['total_visits'].' Visits',
                    $comp['visit_share_percent'].'%',
                    (string) $comp['average_visits'].' Avg Visits',
                ];
            }
            $this->tableRanges[] = [$tableStart, count($rows)];

            // Subsection 2: Highest Completion Summary
            $rows[] = ['', '', '', '', ''];
            $rows[] = ["Analysis Summary: Top {$prefix}s by Target Completion Rate", '', '', '', ''];
            $this->groupTitleRows[] = count($rows);
            $rows[] = ['Rank', $prefix, 'Completion Rate (%)', 'Met Target / Total', 'Average Visits'];
            $this->headerRows[] = count($rows);
            $tableStart = count($rows);

            foreach ($topCompletion as $index => $comp) {
                $rows[] = [
                    '#'.($index + 1),
                    (string) $comp['label'],
                    $comp['completion_percent'].'%',
                    $comp['met_required'].' / '.$comp['visitors'].' Met Target',
                    (string) $comp['average_visits'].' Avg Visits',
                ];
            }
            $this->tableRanges[] = [$tableStart, count($rows)];
        }

        return $rows;
    }

    public function columnWidths(): array
    {
        return ['A' => 18, 'B' => 36, 'C' => 18, 'D' => 12, 'E' => 13, 'F' => 13];
    }

    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_TEXT,
            'C' => NumberFormat::FORMAT_TEXT,
            'E' => NumberFormat::FORMAT_TEXT,
        ];
    }

    public function drawings(): array
    {
        $leftLogo = public_path('images/rmmc-left-logo.jpg');
        $rightLogo = public_path('images/rmmc-right-logo.jpg');
        $defaultLogo = public_path('images/rmmc-logo.jpg');

        $leftLogoPath = is_file($leftLogo) ? $leftLogo : (is_file($defaultLogo) ? $defaultLogo : null);
        $rightLogoPath = is_file($rightLogo) ? $rightLogo : (is_file($defaultLogo) ? $defaultLogo : null);

        $drawings = [];
        if ($leftLogoPath) {
            $drawings[] = $this->logo($leftLogoPath, 'A1');
        }
        if ($rightLogoPath) {
            $drawings[] = $this->logo($rightLogoPath, 'F1');
        }

        return $drawings;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => fn (AfterSheet $event) => (new VisitReportExcelStyler(
                $this->headerRows,
                $this->tableRanges,
                $this->groupTitleRows,
                [],
                [],
                $this->summaryHeaderRows,
                $this->summaryTableRanges
            ))($event),
        ];
    }

    public function title(): string
    {
        return 'Library Progress Report';
    }

    private function titleRows(): array
    {
        return [
            ['', 'RAMON MAGSAYSAY MEMORIAL', '', '', ''],
            ['', 'COLLEGES INTEGRATED SCHOOL', '', '', ''],
            ['', 'Ventilation St., Lagao, General Santos City, Philippines', '', '', ''],
            ['', 'rmmcbep@gmail.com / +639518240218', '', '', ''],
            ['Library Progress Report', '', '', '', ''],
            ['School Year: '.($this->report['school_year']['name'] ?? 'No school year'), '', '', 'Visitor Type: '.ucfirst($this->report['summary']['visitor_type'] ?? 'visitor'), ''],
            ['From: '.$this->date('start_date'), '', '', 'To: '.$this->date('end_date'), ''],
        ];
    }

    private function logo(string $path, string $cell): Drawing
    {
        return (new Drawing)->setPath($path)->setCoordinates($cell)->setHeight(84)->setOffsetX(8)->setOffsetY(4);
    }

    private function groupPrefix(): string
    {
        if (($this->report['summary']['visitor_type'] ?? null) !== 'student') {
            return 'Department';
        }

        if (! empty($this->report['filters']['sections']) || empty($this->report['filters']['year_levels'])) {
            return 'Year & Section';
        }

        if (count($this->report['filters']['year_levels'] ?? []) === 1) {
            return 'Section';
        }

        return 'Year Level';
    }

    private function requiredVisits(): int
    {
        return (int) ($this->report['summary']['required_visits'] ?? 0);
    }

    private function date(string $key): string
    {
        return Carbon::parse($this->report['filters'][$key])->format('F j, Y');
    }
}
