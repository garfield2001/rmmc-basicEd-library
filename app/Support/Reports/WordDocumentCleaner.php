<?php

namespace App\Support\Reports;

use DOMDocument;
use DOMElement;
use ZipArchive;

class WordDocumentCleaner
{
    private const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    public function clean(string $path): void
    {
        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            return;
        }

        $settings = $zip->getFromName('word/settings.xml');

        if (is_string($settings)) {
            $zip->addFromString('word/settings.xml', $this->cleanSettings($settings));
        }

        $zip->close();
    }

    private function cleanSettings(string $xml): string
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $document->preserveWhiteSpace = false;
        $document->formatOutput = false;
        $document->loadXML($xml);

        $settings = $document->documentElement;

        if (! $settings instanceof DOMElement) {
            return $xml;
        }

        $this->upsertElement($document, $settings, 'view', ['val' => 'print']);
        $this->upsertElement($document, $settings, 'zoom', ['percent' => '100']);
        $this->upsertElement($document, $settings, 'hideSpellingErrors');
        $this->upsertElement($document, $settings, 'hideGrammaticalErrors');
        $this->upsertElement($document, $settings, 'updateFields', ['val' => 'true']);
        $this->removeElement($settings, 'trackRevisions');

        return $document->saveXML() ?: $xml;
    }

    private function upsertElement(DOMDocument $document, DOMElement $parent, string $name, array $attributes = []): void
    {
        $element = $this->firstChild($parent, $name);

        if (! $element) {
            $element = $document->createElementNS(self::WORD_NS, "w:{$name}");
            $parent->appendChild($element);
        }

        foreach ($attributes as $attribute => $value) {
            $element->setAttributeNS(self::WORD_NS, "w:{$attribute}", $value);
        }
    }

    private function removeElement(DOMElement $parent, string $name): void
    {
        while ($element = $this->firstChild($parent, $name)) {
            $parent->removeChild($element);
        }
    }

    private function firstChild(DOMElement $parent, string $name): ?DOMElement
    {
        foreach ($parent->childNodes as $child) {
            if ($child instanceof DOMElement && $child->namespaceURI === self::WORD_NS && $child->localName === $name) {
                return $child;
            }
        }

        return null;
    }
}
