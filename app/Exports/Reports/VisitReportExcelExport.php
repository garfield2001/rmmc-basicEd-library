<?php

namespace App\Exports\Reports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class VisitReportExcelExport implements FromArray, WithColumnWidths, WithDrawings, WithEvents, WithTitle
{
    private array $headerRows = [];
    private array $tableRanges = [];
    private array $groupTitleRows = [];
    private array $summaryRows = [];

    public function __construct(private readonly array $report, private readonly array $groups) {}

    public function array(): array
    {
        $rows = $this->titleRows();

        foreach ($this->groups as $group) {
            $rows[] = [];
            $rows[] = [$this->groupPrefix().': '.$group['label']];
            $this->groupTitleRows[] = count($rows);
            $rows[] = ['School ID', 'Name', 'Visits', 'Excess', 'Progress'];
            $this->headerRows[] = count($rows);
            $tableStart = count($rows);

            foreach ($group['rows'] as $row) {
                $rows[] = [$row['school_id'], $row['name'], $row['visit_count'].' / '.$this->requiredVisits(), $row['excess_visits'] ?? 0, $row['progress_percent'].'%'];
            }

            $this->tableRanges[] = [$tableStart, count($rows)];
            $summary = $group['summary'];
            $rows[] = ["Visitors: {$summary['visitors']}", "Total Visits: {$summary['total_visits']}", "Excess Visits: {$summary['excess_visits']}"];
            $this->summaryRows[] = count($rows);
        }

        return $rows;
    }

    public function columnWidths(): array
    {
        return ['A' => 16, 'B' => 28, 'C' => 14, 'D' => 14, 'E' => 16];
    }

    public function drawings(): array
    {
        $logoPath = public_path('images/rmmc-logo.jpg');

        if (! is_file($logoPath)) {
            return [];
        }

        return [$this->logo($logoPath, 'A1'), $this->logo($logoPath, 'E1')];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => fn (AfterSheet $event) => (new VisitReportExcelStyler(
                $this->headerRows,
                $this->tableRanges,
                $this->groupTitleRows,
                $this->summaryRows,
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
        return ($this->report['summary']['visitor_type'] ?? null) === 'student' ? 'Year & Section' : 'Department';
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
