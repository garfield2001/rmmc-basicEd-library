<?php

namespace App\Support\Reports;

class PdfDocument
{
    public function build(array $pages, callable $contentForPage): string
    {
        $objects = [];
        $pageIds = [];
        $nextId = 3;
        $normalFontId = 3 + (count($pages) * 2);
        $boldFontId = $normalFontId + 1;

        foreach ($pages as $pageIndex => $items) {
            $pageId = $nextId++;
            $contentId = $nextId++;
            $pageIds[] = $pageId;
            $content = $contentForPage($items, $pageIndex + 1, count($pages));

            $objects[$pageId] = sprintf(
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 %d 0 R /F2 %d 0 R >> >> /Contents %d 0 R >>',
                $normalFontId,
                $boldFontId,
                $contentId,
            );
            $objects[$contentId] = '<< /Length '.strlen($content)." >>\nstream\n".$content."\nendstream";
        }

        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', array_map(fn (int $id): string => $id.' 0 R', $pageIds)).'] /Count '.count($pageIds).' >>';
        $objects[$normalFontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
        $objects[$boldFontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

        ksort($objects);

        return $this->serialize($objects);
    }

    private function serialize(array $objects): string
    {
        $pdf = "%PDF-1.4\n";
        $offsets = [0 => 0];

        foreach ($objects as $id => $object) {
            $offsets[$id] = strlen($pdf);
            $pdf .= $id." 0 obj\n".$object."\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";

        for ($id = 1; $id <= count($objects); $id++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
        }

        return $pdf."trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";
    }
}
