<?php

namespace App\Services\Library\Imports;

class LibraryMemberDelimitedReader
{
    public function __construct(
        private readonly LibraryMemberImportRowNormalizer $rows,
        private readonly LibraryMemberRosterRowParser $roster,
    ) {}

    /**
     * @return array<int, array<string, string>>
     */
    public function csv(string $path, string $delimiter = ','): array
    {
        $handle = fopen($path, 'r');

        if (! $handle) {
            return [];
        }

        $rawRows = [];

        while (($data = fgetcsv($handle, separator: $delimiter)) !== false) {
            if (count(array_filter($data, fn ($value) => trim((string) $value) !== '')) > 0) {
                $rawRows[] = $data;
            }
        }

        fclose($handle);

        return $this->roster->headerRowsFromValues($rawRows);
    }

    /**
     * @return array<int, array<string, string>>
     */
    public function htmlTable(string $html): array
    {
        $previous = libxml_use_internal_errors(true);
        $document = new \DOMDocument;
        $document->loadHTML($html);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $rawRows = [];

        foreach ($document->getElementsByTagName('tr') as $row) {
            $cells = [];

            foreach (['th', 'td'] as $tag) {
                foreach ($row->getElementsByTagName($tag) as $cell) {
                    $cells[] = trim($cell->textContent);
                }
            }

            if (count(array_filter($cells, fn ($value) => trim((string) $value) !== '')) > 0) {
                $rawRows[] = $cells;
            }
        }

        return $this->roster->headerRowsFromValues($rawRows);
    }
}
