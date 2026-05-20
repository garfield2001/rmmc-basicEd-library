<?php

namespace App\Services\Library\Imports;

class LibraryMemberWordRosterReader
{
    public function __construct(
        private readonly LibraryMemberClassGroupParser $classGroups,
        private readonly LibraryMemberRosterRowParser $roster,
    ) {}

    /**
     * @return array<int, array<string, string>>
     */
    public function read(string $path): array
    {
        $zip = new \ZipArchive;

        if ($zip->open($path) !== true) {
            return [];
        }

        $documentXml = $zip->getFromName('word/document.xml');
        $zip->close();

        if (! is_string($documentXml)) {
            return [];
        }

        $previous = libxml_use_internal_errors(true);
        $document = new \DOMDocument;
        $loaded = $document->loadXML($documentXml);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $loaded) {
            return [];
        }

        $xpath = new \DOMXPath($document);
        $xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');
        $body = $xpath->query('//w:body')->item(0);

        return $body ? $this->bodyRows($body, $xpath) : [];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function bodyRows(\DOMNode $body, \DOMXPath $xpath): array
    {
        $rows = [];
        $classGroup = null;

        foreach ($body->childNodes as $child) {
            if ($child->localName === 'p') {
                $classGroup = $this->classGroups->fromText($this->nodeText($child, $xpath)) ?? $classGroup;

                continue;
            }

            if ($child->localName !== 'tbl' || ! $classGroup) {
                continue;
            }

            $rows = [...$rows, ...$this->roster->rosterRowsFromValues($this->tableRows($child, $xpath), $classGroup)];
        }

        return $rows;
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function tableRows(\DOMNode $table, \DOMXPath $xpath): array
    {
        $rows = [];

        foreach ($xpath->query('./w:tr', $table) as $tableRow) {
            $values = [];

            foreach ($xpath->query('./w:tc', $tableRow) as $cell) {
                $values[] = $this->nodeText($cell, $xpath);
            }

            $rows[] = $values;
        }

        return $rows;
    }

    private function nodeText(\DOMNode $node, \DOMXPath $xpath): string
    {
        $text = '';

        foreach ($xpath->query('.//w:t', $node) as $textNode) {
            $text .= $textNode->textContent;
        }

        return trim($text);
    }
}
