<?php

namespace App\Services\Exports;

use App\Support\Reports\WordDocumentCleaner;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpWord\SimpleType\Jc;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Service responsible for exporting admin table data to Word (.docx) format.
 * Handles the creation of formatted Word documents with tables, headers, and styling
 * for various admin export functionalities (registered visitors, visit logs, etc.).
 */
class AdminTableWordExportService
{
    /**
     * Generate and download a Word document export.
     *
     * @param array  $payload    The data payload containing columns, groups, and metadata
     * @param string $filename   The name of the file to be downloaded
     * @return BinaryFileResponse The downloadable file response
     */
    public function download(array $payload, string $filename): BinaryFileResponse
    {
        $path = tempnam(sys_get_temp_dir(), 'admin-table-export-').'.docx';
        Settings::setOutputEscapingEnabled(true);
        IOFactory::createWriter($this->document($payload), 'Word2007')->save($path);
        app(WordDocumentCleaner::class)->clean($path);

        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Create the PhpWord document object with all content.
     *
     * @param array $payload The data payload to be exported
     * @return PhpWord       The configured PhpWord document instance
     */
    private function document(array $payload): PhpWord
    {
        $word = new PhpWord;
        $word->setDefaultFontName('Calibri');
        $word->setDefaultFontSize(10);
        $word->getCompatibility()->setOoxmlVersion(15);
        $word->getSettings()->setHideSpellingErrors(true);
        $word->getSettings()->setHideGrammaticalErrors(true);
        $word->addTableStyle('export-table', $this->tableStyle(), ['bgColor' => 'E8EEFC', 'bold' => true]);

        $section = $word->addSection(['paperSize' => 'Letter', 'marginTop' => 648, 'marginRight' => 648, 'marginBottom' => 1008, 'marginLeft' => 648]);
        $section->addFooter()->addPreserveText('Page {PAGE} of {NUMPAGES}', ['size' => 9, 'color' => '020659'], ['alignment' => Jc::RIGHT]);
        $this->letterhead($section);
        $section->addText($payload['title'], ['bold' => true, 'size' => 17, 'color' => '010440'], ['alignment' => Jc::CENTER, 'spaceAfter' => 120]);
        $this->metadata($section, $payload);
        foreach ($payload['groups'] as $group) {
            $this->group($section, $payload, $group);
        }

        $this->comparison($section, $payload);

        return $word;
    }

    /**
     * Add the letterhead section to the document.
     *
     * @param object $section The section to add the letterhead to
     * @return void
     */
    private function letterhead($section): void
    {
        $table = $section->addTable(['borderSize' => 0, 'cellMargin' => 0, 'alignment' => Jc::CENTER]);
        $table->addRow();
        $cellStyle = ['borderSize' => 0, 'borderColor' => 'FFFFFF'];
        $left = $table->addCell(1300, $cellStyle);
        $center = $table->addCell(6600, $cellStyle);
        $right = $table->addCell(1300, $cellStyle);
        
        $leftLogo = public_path('images/rmmc-left-logo.jpg');
        $rightLogo = public_path('images/rmmc-right-logo.jpg');
        $defaultLogo = public_path('images/rmmc-logo.jpg');
        
        $leftLogoPath = is_file($leftLogo) ? $leftLogo : (is_file($defaultLogo) ? $defaultLogo : null);
        $rightLogoPath = is_file($rightLogo) ? $rightLogo : (is_file($defaultLogo) ? $defaultLogo : null);

        if ($leftLogoPath) {
            $left->addImage($leftLogoPath, ['width' => 62, 'height' => 62, 'alignment' => Jc::CENTER]);
        }
        if ($rightLogoPath) {
            $right->addImage($rightLogoPath, ['width' => 62, 'height' => 62, 'alignment' => Jc::CENTER]);
        }

        $center->addText('RAMON MAGSAYSAY MEMORIAL', ['bold' => true, 'size' => 16], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $center->addText('COLLEGES INTEGRATED SCHOOL', ['bold' => true, 'size' => 16], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $center->addText('Ventilation St., Lagao, General Santos City, Philippines', [], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $center->addText('rmmcbep@gmail.com / +639518240218', ['color' => '0645AD'], ['alignment' => Jc::CENTER, 'spaceAfter' => 180]);
    }

    /**
     * Add metadata section (school year, visitor type, date range) to the document.
     *
     * @param object $section The section to add metadata to
     * @param array  $payload The data payload containing metadata
     * @return void
     */
    private function metadata($section, array $payload): void
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
        $run1->addText($payload['school_year']['name'] ?? 'No school year', ['color' => '374151', 'bold' => true, 'size' => 9]);
        
        $run2 = $table->addCell(2400, $cellStyle)->addTextRun(['alignment' => Jc::CENTER]);
        $run2->addText('VISITOR TYPE: ', ['color' => '6B7280', 'bold' => true, 'size' => 8]);
        $run2->addText($payload['visitor_label'], ['color' => '374151', 'bold' => true, 'size' => 9]);
        
        $dates = explode(' to ', $payload['date_range']);
        $start = $dates[0] ?? '';
        $end = $dates[1] ?? '';
        
        $run3 = $table->addCell(2400, $cellStyle)->addTextRun(['alignment' => Jc::CENTER]);
        $run3->addText('FROM: ', ['color' => '6B7280', 'bold' => true, 'size' => 8]);
        $run3->addText($start, ['color' => '374151', 'bold' => true, 'size' => 9]);
        
        $run4 = $table->addCell(2400, $cellStyle)->addTextRun(['alignment' => Jc::CENTER]);
        $run4->addText('TO: ', ['color' => '6B7280', 'bold' => true, 'size' => 8]);
        $run4->addText($end, ['color' => '374151', 'bold' => true, 'size' => 9]);
        
        $section->addText('', [], ['spaceAfter' => 240]);
    }

    /**
     * Add a data group section to the document.
     *
     * @param object $section The section to add the group to
     * @param array  $payload The data payload containing column definitions
     * @param array  $group   The group data to export
     * @return void
     */
    private function group($section, array $payload, array $group): void
    {
        $section->addText($payload['group_label'].': '.$group['label'], ['bold' => true, 'color' => '010440'], ['alignment' => Jc::CENTER, 'spaceBefore' => 160]);
        $table = $section->addTable('export-table');
        $this->headerRow($table, array_column($payload['columns'], 'label'), $payload['columns']);

        foreach ($group['rows'] as $row) {
            $this->dataRow($table, array_map(fn (array $column): string => (string) ($row[$column['key']] ?? ''), $payload['columns']), $payload['columns']);
        }

        $this->summary($section, $group['summary'] ?? []);
    }

    /**
     * Add a header row to the export table (no borders, colored background).
     */
    private function headerRow($table, array $values, array $columns): void
    {
        $table->addRow();
        $total = collect($columns)->sum(fn ($c) => $c['excel_width'] ?? 18);
        $available = 9200;

        foreach ($values as $index => $value) {
            $width = (int) round(($columns[$index]['excel_width'] ?? 18) / $total * $available);
            $table->addCell($width, ['borderSize' => 6, 'borderColor' => '111827', 'bgColor' => 'E8EEFC'])
                ->addText((string) $value, ['bold' => true], ['alignment' => Jc::START, 'spaceAfter' => 0]);
        }
    }

    /**
     * Add a data row to the export table (with borders).
     */
    private function dataRow($table, array $values, array $columns): void
    {
        $table->addRow();
        $total = collect($columns)->sum(fn ($c) => $c['excel_width'] ?? 18);
        $available = 9200;

        foreach ($values as $index => $value) {
            $width = (int) round(($columns[$index]['excel_width'] ?? 18) / $total * $available);
            $table->addCell($width)->addText((string) $value, [], ['spaceAfter' => 0]);
        }
    }

    /**
     * Add a summary section to the document.
     */
    private function summary($section, array $summary): void
    {
        $cellStyle = ['borderSize' => 0, 'borderColor' => 'FFFFFF'];
        $table = $section->addTable(['borderSize' => 0, 'cellMargin' => 0, 'borderColor' => 'FFFFFF']);
        $table->addRow();

        foreach (array_pad($summary, 3, ['label' => '', 'value' => '']) as $index => $item) {
            $table->addCell(3000, $cellStyle)->addText($item['label'] ? "{$item['label']}: {$item['value']}" : '', ['bold' => true], [
                'alignment' => $index === 1 ? Jc::CENTER : Jc::START,
                'spaceBefore' => 80,
                'spaceAfter' => 150,
            ]);
        }
    }

    private function comparison($section, array $payload): void
    {
        $comparison = $payload['group_comparison'] ?? [];

        if (count($comparison) < 2) {
            return;
        }

        $section->addPageBreak();

        $section->addText($payload['group_label'].' Progress Comparison (Analysis Summary)', ['bold' => true, 'color' => '010440', 'size' => 14], [
            'alignment' => Jc::CENTER,
            'spaceBefore' => 160,
            'spaceAfter' => 80,
        ]);

        $table = $section->addTable([
            'borderSize' => 0,
            'borderColor' => 'FFFFFF',
            'cellMargin' => 70,
            'alignment' => Jc::CENTER,
        ]);

        foreach ($comparison as $item) {
            $table->addRow();
            
            // Left Column: Label
            $labelCell = $table->addCell(3000, ['valign' => 'center']);
            $labelCell->addText((string) ($item['label'] ?? ''), ['bold' => true, 'size' => 11, 'color' => '111827'], ['alignment' => Jc::END, 'spaceAfter' => 0]);
            
            // Right Column: Stacked Bars & Stats
            $chartCell = $table->addCell(6000);
            
            // Completion Bar
            $compRun = $chartCell->addTextRun(['spaceAfter' => 0]);
            $compRun->addText('Completion: ', ['color' => '6B7280', 'size' => 9]);
            $compRun->addText($this->barText((int) ($item['completion_percent'] ?? 0)), ['color' => '10B981']);
            $compRun->addText(' ' . ($item['completion_percent'] ?? 0) . '%', ['bold' => true, 'color' => '374151', 'size' => 10]);
            
            // Visit Share Bar
            $shareRun = $chartCell->addTextRun(['spaceAfter' => 0]);
            $shareRun->addText('Visit Share: ', ['color' => '6B7280', 'size' => 9]);
            $shareRun->addText($this->barText((int) ($item['visit_share_percent'] ?? 0)), ['color' => '3B82F6']);
            $shareRun->addText(' ' . ($item['visit_share_percent'] ?? 0) . '%', ['bold' => true, 'color' => '374151', 'size' => 10]);
            
            // Metrics
            $metricRun = $chartCell->addTextRun(['spaceAfter' => 180]);
            $metricRun->addText('Total Visits: ', ['color' => '6B7280', 'size' => 9]);
            $metricRun->addText((string) ($item['total_visits'] ?? 0), ['bold' => true, 'color' => '374151', 'size' => 10]);
            $metricRun->addText('  |  Avg/Met: ', ['color' => '6B7280', 'size' => 9]);
            $metricRun->addText(($item['average_visits'] ?? 0) . ' avg / ' . ($item['met_required'] ?? 0) . ' met', ['bold' => true, 'color' => '374151', 'size' => 10]);
        }
    }

    private function barText(int $percent): string
    {
        $filled = (int) round(max(0, min(100, $percent)) / 10);

        return str_repeat('█', $filled).str_repeat('░', 10 - $filled);
    }

    /**
     * Define the table style for export tables.
     *
     * @return array The table style configuration
     */
    private function tableStyle(): array
    {
        return ['borderSize' => 6, 'borderColor' => '111827', 'cellMargin' => 70, 'alignment' => Jc::CENTER];
    }
}
