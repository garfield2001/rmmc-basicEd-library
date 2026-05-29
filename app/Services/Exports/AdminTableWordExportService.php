<?php

namespace App\Services\Exports;

use App\Support\Reports\WordDocumentCleaner;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpWord\SimpleType\Jc;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminTableWordExportService
{
    public function download(array $payload, string $filename): BinaryFileResponse
    {
        $path = tempnam(sys_get_temp_dir(), 'admin-table-export-').'.docx';
        Settings::setOutputEscapingEnabled(true);
        IOFactory::createWriter($this->document($payload), 'Word2007')->save($path);
        app(WordDocumentCleaner::class)->clean($path);

        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }

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

        return $word;
    }

    private function letterhead($section): void
    {
        $table = $section->addTable(['borderSize' => 0, 'cellMargin' => 0, 'alignment' => Jc::CENTER]);
        $table->addRow();
        $logo = public_path('images/rmmc-logo.jpg');
        $left = $table->addCell(1300);
        $center = $table->addCell(6600);
        $right = $table->addCell(1300);

        if (is_file($logo)) {
            $left->addImage($logo, ['width' => 62, 'height' => 62, 'alignment' => Jc::CENTER]);
            $right->addImage($logo, ['width' => 62, 'height' => 62, 'alignment' => Jc::CENTER]);
        }

        $center->addText('RAMON MAGSAYSAY MEMORIAL', ['bold' => true, 'size' => 16], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $center->addText('COLLEGES INTEGRATED SCHOOL', ['bold' => true, 'size' => 16], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $center->addText('Ventilation St., Lagao, General Santos City, Philippines', [], ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $center->addText('rmmcbep@gmail.com / +639518240218', ['color' => '0645AD'], ['alignment' => Jc::CENTER, 'spaceAfter' => 180]);
    }

    private function metadata($section, array $payload): void
    {
        $table = $section->addTable(['borderSize' => 0, 'cellMargin' => 60, 'alignment' => Jc::CENTER]);
        $table->addRow();
        $table->addCell(3600)->addText('School Year: '.($payload['school_year']['name'] ?? 'No school year'), ['bold' => true]);
        $table->addCell(3600)->addText('Visitor Type: '.$payload['visitor_label'], ['bold' => true]);
        $table->addRow();
        $table->addCell(7200, ['gridSpan' => 2])->addText('Date Range: '.$payload['date_range'], ['bold' => true]);
    }

    private function group($section, array $payload, array $group): void
    {
        $section->addText($payload['group_label'].': '.$group['label'], ['bold' => true, 'color' => '010440'], ['alignment' => Jc::CENTER, 'spaceBefore' => 160]);
        $table = $section->addTable('export-table');
        $this->row($table, array_column($payload['columns'], 'label'), true);

        foreach ($group['rows'] as $row) {
            $this->row($table, array_map(fn (array $column): string => (string) ($row[$column['key']] ?? ''), $payload['columns']));
        }

        $this->summary($section, $group['summary'] ?? []);
    }

    private function row($table, array $values, bool $header = false): void
    {
        $table->addRow();
        $width = (int) floor(9200 / max(count($values), 1));

        foreach ($values as $value) {
            $table->addCell($width)->addText((string) $value, ['bold' => $header], ['spaceAfter' => 0]);
        }
    }

    private function summary($section, array $summary): void
    {
        $table = $section->addTable(['borderSize' => 0, 'cellMargin' => 0]);
        $table->addRow();

        foreach (array_pad($summary, 3, ['label' => '', 'value' => '']) as $index => $item) {
            $table->addCell(3000)->addText($item['label'] ? "{$item['label']}: {$item['value']}" : '', ['bold' => true], [
                'alignment' => $index === 1 ? Jc::CENTER : Jc::START,
                'spaceBefore' => 80,
                'spaceAfter' => 150,
            ]);
        }
    }

    private function tableStyle(): array
    {
        return ['borderSize' => 6, 'borderColor' => '111827', 'cellMargin' => 70, 'alignment' => Jc::CENTER];
    }
}
