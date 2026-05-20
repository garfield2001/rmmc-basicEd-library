<?php

namespace App\Services\Library\Imports;

class LibraryMemberDelimitedReader
{
    public function __construct(private readonly LibraryMemberImportRowNormalizer $rows) {}

    /**
     * @return array<int, array<string, string>>
     */
    public function csv(string $path, string $delimiter = ','): array
    {
        $handle = fopen($path, 'r');

        if (! $handle) {
            return [];
        }

        $headers = null;
        $rows = [];

        while (($data = fgetcsv($handle, separator: $delimiter)) !== false) {
            if ($headers === null) {
                $headers = array_map(fn ($header) => $this->rows->normalizeHeader((string) $header), $data);

                continue;
            }

            if (count(array_filter($data, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $rows[] = array_combine($headers, array_pad(array_map('strval', $data), count($headers), '')) ?: [];
        }

        fclose($handle);

        return $rows;
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

        $headers = [];
        $rows = [];

        foreach ($document->getElementsByTagName('tr') as $trIndex => $row) {
            $cells = [];

            foreach (['th', 'td'] as $tag) {
                foreach ($row->getElementsByTagName($tag) as $cell) {
                    $cells[] = trim($cell->textContent);
                }
            }

            if ($trIndex === 0) {
                $headers = array_map(fn ($header) => $this->rows->normalizeHeader($header), $cells);

                continue;
            }

            if ($headers === [] || count(array_filter($cells, fn ($value) => trim($value) !== '')) === 0) {
                continue;
            }

            $rows[] = array_combine($headers, array_pad($cells, count($headers), '')) ?: [];
        }

        return $rows;
    }
}
