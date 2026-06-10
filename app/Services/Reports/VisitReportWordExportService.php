<?php

namespace App\Services\Reports;

use App\Support\Reports\WordDocumentCleaner;
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
        $path = tempnam(sys_get_temp_dir(), 'visit-report-') . '.docx';
        Settings::setOutputEscapingEnabled(true);
        IOFactory::createWriter($this->document($report, $groups), 'Word2007')->save($path);
        app(WordDocumentCleaner::class)->clean($path);

        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }

    private function document(array $report, array $groups): PhpWord
    {
        $word = new PhpWord;
        $word->getCompatibility()->setOoxmlVersion(15);
        $word->getSettings()->setHideSpellingErrors(true);
        $word->getSettings()->setHideGrammaticalErrors(true);
        $word->getSettings()->setUpdateFields(true);
        $word->setDefaultFontName('Calibri');
        $word->setDefaultFontSize(11);
        $word->addTableStyle('report-table', $this->tableStyle(), ['bgColor' => 'E8EEFC', 'bold' => true]);
        $section = $word->addSection(['paperSize' => 'Letter', 'marginTop' => 648, 'marginRight' => 792, 'marginBottom' => 1008, 'marginLeft' => 792, 'footerHeight' => 360]);
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
        $cellStyle = ['borderSize' => 0, 'borderColor' => 'FFFFFF'];
        $left = $table->addCell(1500, $cellStyle);
        $center = $table->addCell(6300, $cellStyle);
        $right = $table->addCell(1500, $cellStyle);

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
    }

    private function metaRow($table, string $leftLabel, string $leftValue, string $rightLabel, string $rightValue): void
    {
        $cellStyle = ['borderSize' => 0, 'borderColor' => 'FFFFFF'];
        $table->addRow();
        $this->metaCell($table->addCell(2700, $cellStyle), $leftLabel, $leftValue);
        $this->metaCell($table->addCell(2700, $cellStyle), $rightLabel, $rightValue);
    }

    private function metaCell($cell, string $label, string $value): void
    {
        $run = $cell->addTextRun(['spaceAfter' => 0]);
        $run->addText($label . ' ', ['bold' => true]);
        $run->addText($value);
    }

    private function group($section, array $report, array $group): void
    {
        $section->addText($this->groupPrefix($report) . ': ' . $group['label'], ['bold' => true, 'color' => '010440'], ['alignment' => Jc::CENTER, 'spaceBefore' => 180, 'spaceAfter' => 80]);
        $table = $section->addTable('report-table');
        $this->headerRow($table, ['School ID', 'Name', 'Visits', 'Excess', 'Progress'], self::COLUMN_WIDTHS);

        foreach ($group['rows'] as $row) {
            $this->dataRow($table, [$row['school_id'], $row['name'], $row['visit_count'] . ' / ' . ($report['summary']['required_visits'] ?? 0), $row['excess_visits'] ?? 0, $row['progress_percent'] . '%'], self::COLUMN_WIDTHS);
        }
    }

    private const COLUMN_WIDTHS = [1500, 5000, 1000, 1000, 1100];

    private function headerRow($table, array $values, array $widths): void
    {
        $table->addRow();

        foreach ($values as $index => $value) {
            $table->addCell($widths[$index], ['borderSize' => 6, 'borderColor' => '111827', 'bgColor' => 'E8EEFC'])
                ->addText((string) $value, ['bold' => true], ['alignment' => Jc::START, 'spaceAfter' => 0]);
        }
    }

    private function dataRow($table, array $values, array $widths): void
    {
        $table->addRow();

        foreach ($values as $index => $value) {
            $table->addCell($widths[$index])->addText((string) $value, [], ['spaceAfter' => 0]);
        }
    }

    private function tableStyle(): array
    {
        return ['borderSize' => 6, 'borderColor' => '111827', 'cellMargin' => 80, 'alignment' => Jc::CENTER];
    }

    private function groupPrefix(array $report): string
    {
        if (($report['summary']['visitor_type'] ?? null) !== 'student') {
            return 'Department';
        }

        if (! empty($report['filters']['sections']) || empty($report['filters']['year_levels'])) {
            return 'Year & Section';
        }

        if (count($report['filters']['year_levels'] ?? []) === 1) {
            return 'Section';
        }

        return 'Year Level';
    }

    private function date(array $report, string $key): string
    {
        return Carbon::parse($report['filters'][$key])->format('F j, Y');
    }
}
