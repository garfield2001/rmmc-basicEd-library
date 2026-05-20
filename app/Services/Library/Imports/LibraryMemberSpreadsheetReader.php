<?php

namespace App\Services\Library\Imports;

class LibraryMemberSpreadsheetReader
{
    public function __construct(
        private readonly LibraryMemberClassGroupParser $classGroups,
        private readonly LibraryMemberSpreadsheetWorkbookReader $workbook,
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

        $rows = [];
        $sharedStrings = $this->workbook->sharedStrings($zip);

        foreach ($this->workbook->sheetPaths($zip) as $sheetName => $sheetPath) {
            $sheetRows = $this->workbook->sheetRows($zip, $sheetPath, $sharedStrings);
            $classGroup = $this->classGroups->fromText($sheetName);
            $rosterRows = $this->roster->rosterRowsFromValues($sheetRows, $classGroup);
            $headerRows = $classGroup && $rosterRows !== []
                ? []
                : $this->roster->headerRowsFromValues($sheetRows, $classGroup);

            $rows = [...$rows, ...$this->uniqueRows([...$headerRows, ...$rosterRows])];
        }

        $zip->close();

        return $rows;
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     * @return array<int, array<string, string>>
     */
    private function uniqueRows(array $rows): array
    {
        $seen = [];

        return collect($rows)->filter(function (array $row) use (&$seen): bool {
            $key = mb_strtolower(json_encode($row, JSON_UNESCAPED_UNICODE) ?: '');

            if (isset($seen[$key])) {
                return false;
            }

            $seen[$key] = true;

            return true;
        })->values()->all();
    }
}
