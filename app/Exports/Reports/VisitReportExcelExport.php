<?php

namespace App\Exports\Reports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;

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
        return [AfterSheet::class => fn (AfterSheet $event) => $this->styleSheet($event)];
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

    private function styleSheet(AfterSheet $event): void
    {
        $sheet = $event->sheet->getDelegate();
        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_PORTRAIT)->setPaperSize(PageSetup::PAPERSIZE_LETTER);
        $sheet->getPageSetup()->setFitToWidth(1)->setFitToHeight(0);
        $sheet->getPageMargins()->setTop(0.45)->setRight(0.55)->setBottom(0.45)->setLeft(0.55);
        $sheet->setShowGridlines(false);
        $sheet->getHeaderFooter()->setOddFooter('&RPage &P of &N');

        foreach (['B1:D1', 'B2:D2', 'B3:D3', 'B4:D4', 'A5:E5', 'A6:B6', 'D6:E6', 'A7:B7', 'D7:E7'] as $range) {
            $sheet->mergeCells($range);
        }

        foreach ([1, 2, 3, 4] as $row) {
            $sheet->getRowDimension($row)->setRowHeight($row <= 2 ? 24 : 18);
        }

        $sheet->getRowDimension(5)->setRowHeight(28);
        $sheet->getStyle('A1:E7')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('B1:B2')->getFont()->setBold(true)->setSize(18);
        $sheet->getStyle('A5')->getFont()->setBold(true)->setSize(18)->getColor()->setRGB('010440');
        $sheet->getStyle('A6:E7')->getFont()->setSize(12);

        foreach ($this->headerRows as $row) {
            $this->styleTableHeader($sheet, $row);
        }

        foreach ($this->groupTitleRows as $row) {
            $sheet->mergeCells("A{$row}:E{$row}");
            $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12)->getColor()->setRGB('010440');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        foreach ($this->tableRanges as [$start, $end]) {
            $sheet->getStyle("A{$start}:E{$end}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle("A{$start}:E{$end}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        }

        foreach ($this->summaryRows as $row) {
            $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }
    }

    private function styleTableHeader($sheet, int $row): void
    {
        $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E8EEFC');
        $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:E{$row}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
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
