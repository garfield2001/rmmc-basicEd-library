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

    private array $groupRows = [];

    private array $summaryRows = [];

    public function __construct(private readonly array $payload) {}

    public function array(): array
    {
        $rows = $this->titleRows();
        $columns = $this->payload['columns'];

        foreach ($this->payload['groups'] as $group) {
            $rows[] = array_fill(0, count($columns), '');
            $rows[] = [$this->payload['group_label'].': '.$group['label']];
            $this->groupRows[] = count($rows);
            $rows[] = array_column($columns, 'label');
            $this->headerRows[] = count($rows);

            foreach ($group['rows'] as $row) {
                $rows[] = array_map(fn (array $column): string => (string) ($row[$column['key']] ?? ''), $columns);
            }

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
                $sheet->getStyle("B1:B2")->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle("A5:{$lastColumn}7")->getFont()->setBold(true);

                foreach ($this->groupRows as $row) {
                    $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
                    $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(13);
                }

                foreach ($this->headerRows as $row) {
                    $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->applyFromArray($this->headerStyle());
                }

                foreach ($this->summaryRows as $row) {
                    $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->getFont()->setBold(true);
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
}
