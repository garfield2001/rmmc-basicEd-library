<?php

namespace App\Services\Library\Imports;

use Illuminate\Http\UploadedFile;

class LibraryMemberImportFileReader
{
    public function __construct(
        private readonly LibraryMemberDelimitedReader $delimited,
        private readonly LibraryMemberSpreadsheetReader $spreadsheets,
        private readonly LibraryMemberWordRosterReader $word,
        private readonly LibraryMemberPdfRosterReader $pdf,
    ) {}

    /**
     * @return array<int, array<string, string>>
     */
    public function read(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = (string) $file->getRealPath();

        if ($extension === 'xls') {
            return $this->delimited->htmlTable((string) file_get_contents($path));
        }

        if (in_array($extension, ['xlsx', 'xlsm'], true)) {
            return $this->spreadsheets->read($path);
        }

        if ($extension === 'docx') {
            return $this->word->read($path);
        }

        if ($extension === 'pdf') {
            return $this->pdf->read($path);
        }

        return $this->delimited->csv($path, $extension === 'tsv' ? "\t" : ',');
    }
}
