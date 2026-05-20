<?php

namespace App\Services\Library\Imports;

class LibraryMemberSpreadsheetWorkbookReader
{
    /**
     * @return array<int, string>
     */
    public function sharedStrings(\ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        $shared = is_string($xml) ? simplexml_load_string($xml) : false;

        if (! $shared) {
            return [];
        }

        $strings = [];

        foreach ($shared->si as $item) {
            $text = isset($item->t) ? (string) $item->t : '';

            foreach ($item->r ?? [] as $run) {
                $text .= (string) $run->t;
            }

            $strings[] = $text;
        }

        return $strings;
    }

    /**
     * @return array<string, string>
     */
    public function sheetPaths(\ZipArchive $zip): array
    {
        $workbook = $this->xml($zip, 'xl/workbook.xml');
        $relationships = $this->xml($zip, 'xl/_rels/workbook.xml.rels');

        if (! $workbook || ! $relationships) {
            return [];
        }

        $workbook->registerXPathNamespace('main', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $targets = $this->relationshipTargets($relationships);
        $paths = [];

        foreach ($workbook->xpath('//main:sheet') ?: [] as $sheet) {
            $attributes = $sheet->attributes();
            $relationship = $sheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
            $target = $targets[(string) $relationship['id']] ?? null;

            if ($target) {
                $paths[(string) $attributes['name']] = str_starts_with($target, '/') ? ltrim($target, '/') : 'xl/'.ltrim($target, '/');
            }
        }

        return $paths;
    }

    /**
     * @param  array<int, string>  $sharedStrings
     * @return array<int, array<int, string>>
     */
    public function sheetRows(\ZipArchive $zip, string $sheetPath, array $sharedStrings): array
    {
        $xml = $this->xml($zip, $sheetPath);

        if (! $xml) {
            return [];
        }

        $rows = [];

        foreach ($xml->sheetData->row as $row) {
            $values = $this->rowValues($row, $sharedStrings);

            if (count(array_filter($values, fn ($value) => trim($value) !== '')) > 0) {
                $rows[] = $values;
            }
        }

        return $rows;
    }

    /**
     * @param  array<int, string>  $sharedStrings
     * @return array<int, string>
     */
    private function rowValues(\SimpleXMLElement $row, array $sharedStrings): array
    {
        $cells = [];

        foreach ($row->c as $cell) {
            $type = (string) $cell['t'];
            $value = $type === 's' ? ($sharedStrings[(int) $cell->v] ?? '') : (string) $cell->v;
            $cells[$this->columnIndex((string) $cell['r'])] = trim($type === 'inlineStr' ? (string) $cell->is->t : $value);
        }

        return $cells === [] ? [] : array_map('strval', array_replace(array_fill(0, max(array_keys($cells)) + 1, ''), $cells));
    }

    private function relationshipTargets(\SimpleXMLElement $relationships): array
    {
        $targets = [];

        foreach ($relationships->Relationship as $relationship) {
            $attributes = $relationship->attributes();
            $targets[(string) $attributes['Id']] = (string) $attributes['Target'];
        }

        return $targets;
    }

    private function columnIndex(string $reference): int
    {
        preg_match('/^[A-Z]+/', $reference, $matches);
        $index = 0;

        foreach (str_split($matches[0] ?? 'A') as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }

        return $index - 1;
    }

    private function xml(\ZipArchive $zip, string $path): \SimpleXMLElement|false
    {
        $xml = $zip->getFromName($path);

        return is_string($xml) ? simplexml_load_string($xml) : false;
    }
}
