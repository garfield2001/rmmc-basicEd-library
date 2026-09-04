<?php

namespace App\Exports\Admin;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class AdminTableExcelExport implements FromArray, WithColumnWidths, WithDrawings, WithEvents, WithStrictNullComparison, WithTitle
{
    private array $headerRows = [];

    private array $comparisonRows = [];

    private array $comparisonTitleRows = [];

    private array $groupRows = [];

    private array $statRows = [];

    private array $summaryRows = [];

    private array $tableRanges = [];

    public function __construct(private readonly array $payload) {}

    public function array(): array
    {
        $rows = $this->titleRows();
        $columns = $this->payload['columns'];
        $rows = array_merge($rows, $this->buildComparisonRows(count($columns)));

        foreach ($this->payload['groups'] as $group) {
            $rows[] = array_fill(0, count($columns), '');
            $rows[] = [$this->payload['group_label'].': '.$group['label']];
            $this->groupRows[] = count($rows);
            foreach ($this->statisticsRows($group, count($columns)) as $statRow) {
                $rows[] = $statRow;
                $this->statRows[] = count($rows);
            }
            $rows[] = array_column($columns, 'label');
            $this->headerRows[] = count($rows);
            $tableStart = count($rows);

            foreach ($group['rows'] as $row) {
                $rows[] = array_map(fn (array $column): string => (string) ($row[$column['key']] ?? ''), $columns);
            }

            $this->tableRanges[] = [$tableStart, count($rows)];
            $rows[] = $this->summaryRow($group, count($columns));
            $this->summaryRows[] = count($rows);
        }

        return $rows;
    }

    public function columnWidths(): array
    {
        $letters = range('A', 'Z');

        return collect($this->payload['columns'])
            ->mapWithKeys(fn (array $column, int $index): array => [$letters[$index] => $column['excel_width'] ?? 18])
            ->all();
    }

    public function drawings(): array
    {
        $logo = public_path('images/rmmc-logo.jpg');
        $lastColumn = chr(64 + count($this->payload['columns']));

        return is_file($logo) ? [$this->logo($logo, 'A1'), $this->logo($logo, "{$lastColumn}1")] : [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $sheet = $event->sheet->getDelegate();
                $lastColumn = chr(64 + count($this->payload['columns']));
                $centerEndColumn = chr(63 + count($this->payload['columns']));
                $sheet->mergeCells("B1:{$centerEndColumn}1")->mergeCells("B2:{$centerEndColumn}2")->mergeCells("B3:{$centerEndColumn}3")->mergeCells("B4:{$centerEndColumn}4");
                $sheet->getStyle("A1:{$lastColumn}".max(1, $sheet->getHighestRow()))->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                $sheet->getStyle("B1:{$lastColumn}7")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('B1:B2')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle("A5:{$lastColumn}7")->getFont()->setBold(true);

                foreach ($this->groupRows as $row) {
                    $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
                    $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(13);
                    $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }

                foreach ($this->comparisonTitleRows as $row) {
                    $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
                    $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(13)->getColor()->setRGB('010440');
                    $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }

                foreach ($this->comparisonRows as $row) {
                    $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->applyFromArray($this->statStyle());
                }

                foreach ($this->headerRows as $row) {
                    $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->applyFromArray($this->headerStyle());
                }

                foreach ($this->statRows as $row) {
                    $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->applyFromArray($this->statStyle());
                }

                foreach ($this->summaryRows as $row) {
                    $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->getFont()->setBold(true);
                }

                foreach ($this->tableRanges as [$start, $end]) {
                    $sheet->getStyle("A{$start}:{$lastColumn}{$end}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FF111827');
                    $sheet->getStyle("A{$start}:{$lastColumn}{$end}")->getAlignment()->setWrapText(true);
                }

                $sheet->getStyle('A1:A'.$sheet->getHighestRow())->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            },
        ];
    }

    public function title(): string
    {
        return substr($this->payload['sheet_title'], 0, 31);
    }

    private function titleRows(): array
    {
        return [
            ['', 'RAMON MAGSAYSAY MEMORIAL'],
            ['', 'COLLEGES INTEGRATED SCHOOL'],
            ['', 'Ventilation St., Lagao, General Santos City, Philippines'],
            ['', 'rmmcbep@gmail.com / +639518240218'],
            [$this->payload['title']],
            ['School Year: '.($this->payload['school_year']['name'] ?? 'No school year')],
            ['Date Range: '.$this->payload['date_range'], 'Visitor Type: '.$this->payload['visitor_label']],
        ];
    }

    private function summaryRow(array $group, int $columns): array
    {
        return array_pad(array_map(fn (array $item): string => "{$item['label']}: {$item['value']}", $group['summary'] ?? []), $columns, '');
    }

    private function statisticsRows(array $group, int $columns): array
    {
        $statistics = $group['statistics'] ?? [];

        if ($statistics === []) {
            return [];
        }

        return [
            $this->fitRow([
                'Statistics',
                'Completion',
                ($statistics['completion_percent'] ?? 0).'%',
                $statistics['completion_bar'] ?? '',
                'Visit Share',
                ($statistics['visit_share_percent'] ?? 0).'%',
            ], $columns, ''),
            $this->fitRow([
                '',
                'Met Required',
                (string) ($statistics['met_required'] ?? 0),
                'No Visits',
                (string) ($statistics['no_visits'] ?? 0),
                'Avg Visits: '.($statistics['average_visits'] ?? 0),
            ], $columns, ''),
        ];
    }

    private function fitRow(array $row, int $columns): array
    {
        return array_pad(array_slice($row, 0, $columns), $columns, '');
    }

    private function buildComparisonRows(int $columns): array
    {
        $comparison = $this->payload['group_comparison'] ?? [];

        if (count($comparison) < 2) {
            return [];
        }

        $rows = [
            array_fill(0, $columns, ''),
            $this->fitRow([$this->payload['group_label'].' Progress Comparison'], $columns),
            $this->fitRow([$this->payload['group_label'], 'Completion', 'Visit Share', 'Total Visits', 'Avg Visits', 'Met Required'], $columns),
        ];

        $this->comparisonTitleRows[] = count($this->titleRows()) + 2;
        $this->comparisonRows[] = count($this->titleRows()) + 3;

        foreach ($comparison as $item) {
            $rows[] = $this->fitRow([
                $item['label'] ?? '',
                ($item['completion_percent'] ?? 0).'%',
                ($item['visit_share_percent'] ?? 0).'%',
                (string) ($item['total_visits'] ?? 0),
                (string) ($item['average_visits'] ?? 0),
                (string) ($item['met_required'] ?? 0),
            ], $columns);
            $this->comparisonRows[] = count($this->titleRows()) + count($rows);
        }

        return $rows;
    }

    private function logo(string $path, string $cell): Drawing
    {
        return (new Drawing)->setPath($path)->setCoordinates($cell)->setHeight(72)->setOffsetX(8)->setOffsetY(4);
    }

    private function headerStyle(): array
    {
        return [
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFE8EEFC']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF111827']]],
        ];
    }

    private function statStyle(): array
    {
        return [
            'font' => ['bold' => true, 'color' => ['argb' => 'FF010440']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF6F8FF']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_HAIR, 'color' => ['argb' => 'FFBFC9F5']]],
        ];
    }
}
