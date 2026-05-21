<?php

namespace App\Services\Reports;

use Carbon\Carbon;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpWord\SimpleType\Jc;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class VisitReportWordExportService
{
    public function download(array $report, array $groups, string $filename): BinaryFileResponse
    {
        $path = tempnam(sys_get_temp_dir(), 'visit-report-').'.docx';
        Settings::setOutputEscapingEnabled(true);
        IOFactory::createWriter($this->document($report, $groups), 'Word2007')->save($path);

        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }

    private function document(array $report, array $groups): PhpWord
    {
        $word = new PhpWord;
        $word->setDefaultFontName('Calibri');
        $word->setDefaultFontSize(11);
        $word->addTableStyle('report-table', $this->tableStyle(), ['bgColor' => 'E8EEFC', 'bold' => true]);
        $section = $word->addSection(['paperSize' => 'Letter', 'marginTop' => 648, 'marginRight' => 792, 'marginBottom' => 648, 'marginLeft' => 792]);
        $section->addFooter()->addPreserveText('Page {PAGE} of {NUMPAGES}', ['size' => 10, 'color' => '020659'], ['alignment' => Jc::RIGHT]);

        $this->letterhead($section);
        $section->addText('Library Progress Report', ['bold' => true, 'size' => 18, 'color' => '010440'], ['alignment' => Jc::CENTER, 'spaceAfter' => 160]);
        $this->metadata($section, $report);

        foreach ($groups as $group) {
            $this->group($section, $report, $group);
        }

        return $word;
    }

    private function letterhead($section): void
    {
        $table = $section->addTable(['borderSize' => 0, 'borderColor' => 'FFFFFF', 'cellMargin' => 0, 'alignment' => Jc::CENTER]);
        $table->addRow();
        $logo = public_path('images/rmmc-logo.jpg');
        $left = $table->addCell(1500);
        $center = $table->addCell(6300);
        $right = $table->addCell(1500);

        if (is_file($logo)) {
            $left->addImage($logo, ['width' => 68, 'height' => 68, 'alignment' => Jc::CENTER]);
            $right->addImage($logo, ['width' => 68, 'height' => 68, 'alignment' => Jc::CENTER]);
        }

        $center->addText('RAMON MAGSAYSAY MEMORIAL', ['bold' => true, 'size' => 18], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $center->addText('COLLEGES INTEGRATED SCHOOL', ['bold' => true, 'size' => 18], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $center->addText('Ventilation St., Lagao, General Santos City, Philippines', [], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $center->addText('rmmcbep@gmail.com / +639518240218', ['color' => '0645AD'], ['alignment' => Jc::CENTER, 'spaceAfter' => 240]);
    }

    private function metadata($section, array $report): void
    {
        $table = $section->addTable(['borderSize' => 0, 'borderColor' => 'FFFFFF', 'alignment' => Jc::CENTER, 'cellMargin' => 60]);
        $this->metaRow($table, 'School Year:', $report['school_year']['name'] ?? 'No school year', 'Visitor Type:', ucfirst($report['summary']['visitor_type'] ?? 'visitor'));
        $this->metaRow($table, 'From:', $this->date($report, 'start_date'), 'To:', $this->date($report, 'end_date'));
        $section->addTextBreak(1);
    }

    private function metaRow($table, string $leftLabel, string $leftValue, string $rightLabel, string $rightValue): void
    {
        $table->addRow();
        $this->metaCell($table->addCell(2700), $leftLabel, $leftValue);
        $this->metaCell($table->addCell(2700), $rightLabel, $rightValue);
    }

    private function metaCell($cell, string $label, string $value): void
    {
        $run = $cell->addTextRun(['spaceAfter' => 0]);
        $run->addText($label.' ', ['bold' => true]);
        $run->addText($value);
    }

    private function group($section, array $report, array $group): void
    {
        $section->addText($this->groupPrefix($report).': '.$group['label'], ['bold' => true, 'color' => '010440'], ['alignment' => Jc::CENTER, 'spaceAfter' => 80]);
        $table = $section->addTable('report-table');
        $this->tableRow($table, ['School ID', 'Name', 'Visits', 'Excess', 'Progress'], true);

        foreach ($group['rows'] as $row) {
            $this->tableRow($table, [$row['school_id'], $row['name'], $row['visit_count'].' / '.($report['summary']['required_visits'] ?? 0), $row['excess_visits'] ?? 0, $row['progress_percent'].'%']);
        }

        $summary = $group['summary'];
        $section->addText("Visitors: {$summary['visitors']}     Total Visits: {$summary['total_visits']}     Excess Visits: {$summary['excess_visits']}", ['bold' => true], ['spaceBefore' => 90, 'spaceAfter' => 180]);
    }

    private function tableRow($table, array $values, bool $header = false): void
    {
        $widths = [1500, 5000, 1000, 1000, 1100];
        $table->addRow();

        foreach ($values as $index => $value) {
            $table->addCell($widths[$index])->addText((string) $value, ['bold' => $header], ['spaceAfter' => 0]);
        }
    }

    private function tableStyle(): array
    {
        return ['borderSize' => 6, 'borderColor' => '111827', 'cellMargin' => 80, 'alignment' => Jc::CENTER];
    }

    private function groupPrefix(array $report): string
    {
        return ($report['summary']['visitor_type'] ?? null) === 'student' ? 'Year & Section' : 'Department';
    }

    private function date(array $report, string $key): string
    {
        return Carbon::parse($report['filters'][$key])->format('F j, Y');
    }
}
