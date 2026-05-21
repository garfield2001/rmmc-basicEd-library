<?php

namespace App\Exports\Reports;

use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;

class VisitReportExcelStyler
{
    public function __construct(
        private readonly array $headerRows,
        private readonly array $tableRanges,
        private readonly array $groupTitleRows,
        private readonly array $summaryRows,
    ) {}

    public function __invoke(AfterSheet $event): void
    {
        $sheet = $event->sheet->getDelegate();
        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_PORTRAIT)->setPaperSize(PageSetup::PAPERSIZE_LETTER);
        $sheet->getPageSetup()->setFitToWidth(1)->setFitToHeight(0);
        $sheet->getPageMargins()->setTop(0.45)->setRight(0.55)->setBottom(0.45)->setLeft(0.55);
        $sheet->setShowGridlines(false);
        $sheet->getHeaderFooter()->setOddFooter('&RPage &P of &N');

        $this->styleTitle($sheet);
        $this->styleGroups($sheet);
        $this->styleTables($sheet);
        $this->styleSummaries($sheet);
    }

    private function styleTitle($sheet): void
    {
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
    }

    private function styleGroups($sheet): void
    {
        foreach ($this->groupTitleRows as $row) {
            $sheet->mergeCells("A{$row}:E{$row}");
            $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12)->getColor()->setRGB('010440');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }
    }

    private function styleTables($sheet): void
    {
        foreach ($this->headerRows as $row) {
            $sheet->getStyle("A{$row}:E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E8EEFC');
            $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:E{$row}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        foreach ($this->tableRanges as [$start, $end]) {
            $sheet->getStyle("A{$start}:E{$end}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle("A{$start}:E{$end}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        }
    }

    private function styleSummaries($sheet): void
    {
        foreach ($this->summaryRows as $row) {
            $sheet->getStyle("A{$row}:E{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }
    }
}
