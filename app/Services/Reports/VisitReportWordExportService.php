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
        $path = tempnam(sys_get_temp_dir(), 'visit-report-').'.docx';
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

        $this->comparison($section, $report, $groups);

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
        $table = $section->addTable([
            'borderSize' => 6,
            'borderColor' => 'E5E7EB',
            'cellMargin' => 120,
            'alignment' => Jc::CENTER,
        ]);
        $table->addRow();

        $cellStyle = ['bgColor' => 'F9FAFB', 'valign' => 'center'];

        $run1 = $table->addCell(2400, $cellStyle)->addTextRun(['alignment' => Jc::CENTER]);
        $run1->addText('SCHOOL YEAR: ', ['color' => '6B7280', 'bold' => true, 'size' => 8]);
        $run1->addText($report['school_year']['name'] ?? 'No school year', ['color' => '374151', 'bold' => true, 'size' => 9]);

        $run2 = $table->addCell(2400, $cellStyle)->addTextRun(['alignment' => Jc::CENTER]);
        $run2->addText('VISITOR TYPE: ', ['color' => '6B7280', 'bold' => true, 'size' => 8]);
        $run2->addText(ucfirst($report['summary']['visitor_type'] ?? 'visitor'), ['color' => '374151', 'bold' => true, 'size' => 9]);

        $run3 = $table->addCell(2400, $cellStyle)->addTextRun(['alignment' => Jc::CENTER]);
        $run3->addText('FROM: ', ['color' => '6B7280', 'bold' => true, 'size' => 8]);
        $run3->addText($this->date($report, 'start_date'), ['color' => '374151', 'bold' => true, 'size' => 9]);

        $run4 = $table->addCell(2400, $cellStyle)->addTextRun(['alignment' => Jc::CENTER]);
        $run4->addText('TO: ', ['color' => '6B7280', 'bold' => true, 'size' => 8]);
        $run4->addText($this->date($report, 'end_date'), ['color' => '374151', 'bold' => true, 'size' => 9]);

        $section->addText('', [], ['spaceAfter' => 240]);
    }

    private function group($section, array $report, array $group): void
    {
        $section->addText($this->groupPrefix($report).': '.$group['label'], ['bold' => true, 'color' => '010440'], ['alignment' => Jc::CENTER, 'spaceBefore' => 180, 'spaceAfter' => 80]);
        $table = $section->addTable('report-table');
        $this->headerRow($table, ['School ID', 'Name', 'Visits', 'Excess', 'Progress'], self::COLUMN_WIDTHS);

        foreach ($group['rows'] as $index => $row) {
            $this->dataRow($table, [$row['school_id'], $row['name'], $row['visit_count'].' / '.($report['summary']['required_visits'] ?? 0), $row['excess_visits'] ?? 0, $row['progress_percent'].'%'], self::COLUMN_WIDTHS);
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

    private function comparison($section, array $report, array $groups): void
    {
        $overallVisits = max(1, collect($report['rows'])->sum('visit_count'));
        $comparison = app(VisitReportExportService::class)->comparison($groups, $overallVisits);

        $topVisits = $comparison['top_by_visits'] ?? [];
        $topCompletion = $comparison['top_by_completion'] ?? [];

        if (count($topVisits) < 2) {
            return;
        }

        $section->addPageBreak();

        $prefix = $this->groupPrefix($report);

        // Subsection 1: Highest Total Visits
        $section->addText("Analysis Summary: Top {$prefix}s by Total Visits", ['bold' => true, 'color' => '010440', 'size' => 14], [
            'alignment' => Jc::CENTER,
            'spaceBefore' => 120,
            'spaceAfter' => 80,
        ]);

        $table1 = $section->addTable('report-table');
        $table1->addRow(360, ['tblHeader' => true, 'cantSplit' => true]);
        $table1->addCell(1000)->addText('Rank', ['bold' => true, 'color' => '010440', 'size' => 10], ['alignment' => Jc::CENTER]);
        $table1->addCell(3000)->addText($prefix, ['bold' => true, 'color' => '010440', 'size' => 10]);
        $table1->addCell(2000)->addText('Total Visits', ['bold' => true, 'color' => '010440', 'size' => 10], ['alignment' => Jc::CENTER]);
        $table1->addCell(2000)->addText('Visit Share (%)', ['bold' => true, 'color' => '010440', 'size' => 10], ['alignment' => Jc::CENTER]);
        $table1->addCell(2000)->addText('Average Visits', ['bold' => true, 'color' => '010440', 'size' => 10], ['alignment' => Jc::CENTER]);

        foreach ($topVisits as $index => $item) {
            $table1->addRow(300, ['cantSplit' => true]);
            $table1->addCell(1000)->addText('#'.($index + 1), ['bold' => true, 'size' => 10], ['alignment' => Jc::CENTER]);
            $table1->addCell(3000)->addText((string) ($item['label'] ?? ''), ['bold' => true, 'size' => 10]);
            $table1->addCell(2000)->addText((string) ($item['total_visits'] ?? 0).' Visits', ['size' => 10], ['alignment' => Jc::CENTER]);
            $table1->addCell(2000)->addText(($item['visit_share_percent'] ?? 0).'%', ['size' => 10], ['alignment' => Jc::CENTER]);
            $table1->addCell(2000)->addText(($item['average_visits'] ?? 0).' Avg Visits', ['size' => 10], ['alignment' => Jc::CENTER]);
        }

        // Subsection 2: Highest Completion Summary
        $section->addText("Analysis Summary: Top {$prefix}s by Target Completion Rate", ['bold' => true, 'color' => '010440', 'size' => 14], [
            'alignment' => Jc::CENTER,
            'spaceBefore' => 200,
            'spaceAfter' => 80,
        ]);

        $table2 = $section->addTable('report-table');
        $table2->addRow(360, ['tblHeader' => true, 'cantSplit' => true]);
        $table2->addCell(1000)->addText('Rank', ['bold' => true, 'color' => '010440', 'size' => 10], ['alignment' => Jc::CENTER]);
        $table2->addCell(3000)->addText($prefix, ['bold' => true, 'color' => '010440', 'size' => 10]);
        $table2->addCell(2000)->addText('Completion Rate', ['bold' => true, 'color' => '010440', 'size' => 10], ['alignment' => Jc::CENTER]);
        $table2->addCell(2000)->addText('Met Target / Total', ['bold' => true, 'color' => '010440', 'size' => 10], ['alignment' => Jc::CENTER]);
        $table2->addCell(2000)->addText('Average Visits', ['bold' => true, 'color' => '010440', 'size' => 10], ['alignment' => Jc::CENTER]);

        foreach ($topCompletion as $index => $item) {
            $table2->addRow(300, ['cantSplit' => true]);
            $table2->addCell(1000)->addText('#'.($index + 1), ['bold' => true, 'size' => 10], ['alignment' => Jc::CENTER]);
            $table2->addCell(3000)->addText((string) ($item['label'] ?? ''), ['bold' => true, 'size' => 10]);
            $table2->addCell(2000)->addText(($item['completion_percent'] ?? 0).'%', ['size' => 10], ['alignment' => Jc::CENTER]);
            $table2->addCell(2000)->addText(($item['met_required'] ?? 0).' / '.($item['visitors'] ?? 0).' Met', ['size' => 10], ['alignment' => Jc::CENTER]);
            $table2->addCell(2000)->addText(($item['average_visits'] ?? 0).' Avg Visits', ['size' => 10], ['alignment' => Jc::CENTER]);
        }
    }
}
