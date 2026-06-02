<?php

namespace App\Services\Reports\Exports;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Services\Library\LibraryMemberTableService;
use Illuminate\Support\Collection;

/**
 * Service responsible for preparing data payloads for exporting registered visitors lists.
 * Handles formatting and filtering of library member data for Excel/CSV/Word exports.
 */
class RegisteredVisitorsExportService
{
    /**
     * Create a new service instance.
     *
     * @param LibraryMemberTableService $tables Service for querying and formatting library member data
     */
    public function __construct(private readonly LibraryMemberTableService $tables) {}

    /**
     * Prepare data payload for exporting registered visitors.
     *
     * @param array $filters The filter criteria (search, visitor type, year level, section, department, etc.)
     * @return array         The formatted payload ready for export
     */
    public function payload(array $filters): array
    {
        $schoolYear = SchoolYear::query()->find($filters['school_year_id'] ?? null) ?? SchoolYear::active()->first();
        $type = $filters['visitor_type'] === LibraryMember::TYPE_EMPLOYEE ? LibraryMember::TYPE_EMPLOYEE : LibraryMember::TYPE_STUDENT;
        $query = $this->tables->filteredQuery(
            $type,
            (string) ($filters['search'] ?? ''),
            (string) ($filters['year_level'] ?? ''),
            (string) ($filters['section'] ?? ''),
            $schoolYear?->id,
            (string) ($filters['department'] ?? ''),
        );

        $this->tables->applySort($query, $this->tables->sortOption((string) ($filters['sort'] ?? ''), $type), (string) ($filters['direction'] ?? 'asc'), $schoolYear?->id);
        $rows = $query->get();

        return [
            'title' => ucfirst($type).' Registered Visitors',
            'sheet_title' => 'Registered Visitors',
            'filename_slug' => $type.'-registered-visitors',
            'visitor_label' => ucfirst($type).'s',
            'group_label' => $type === LibraryMember::TYPE_STUDENT ? 'Year & Section' : 'Department',
            'date_range' => 'Roster as of '.now()->format('M j, Y'),
            'filters' => ['start_date' => now()->toDateString(), 'end_date' => now()->toDateString(), 'visitor_type' => $type],
            'school_year' => $schoolYear ? $this->schoolYearData($schoolYear) : null,
            'columns' => $this->columns($type),
            'groups' => $this->groups($rows, $type),
        ];
    }

    /**
     * Define the column structure for the export based on visitor type.
     *
     * @param string $type Either LibraryMember::TYPE_STUDENT or LibraryMember::TYPE_EMPLOYEE
     * @return array       Array of column definitions with keys, labels, and Excel widths
     */
    private function columns(string $type): array
    {
        return [
            ['key' => 'school_id', 'label' => 'School ID', 'excel_width' => 18],
            ['key' => 'name', 'label' => 'Name', 'excel_width' => 34],
            ['key' => 'rfid_uid', 'label' => 'RFID UID', 'excel_width' => 22],
            [
                'key' => 'group',
                'label' => $type === LibraryMember::TYPE_STUDENT ? 'Year / Section' : 'Department',
                'excel_width' => 30,
            ],
        ];
    }

    /**
     * Group the visitors by year/section or department based on visitor type.
     *
     * @param Collection $visitors The collection of library members to group
     * @param string     $type     Either LibraryMember::TYPE_STUDENT or LibraryMember::TYPE_EMPLOYEE
     * @return array             Array of grouped data with labels, rows, and summary statistics
     */
    private function groups(Collection $visitors, string $type): array
    {
        return $visitors
            ->groupBy(fn (LibraryMember $visitor): string => $this->groupLabel($visitor, $type))
            ->sortKeys()
            ->map(fn (Collection $group, string $label): array => [
                'label' => $label,
                'rows' => $group->map(fn (LibraryMember $visitor): array => $this->row($visitor, $type))->values()->all(),
                'summary' => [['label' => 'Visitors', 'value' => $group->count()]],
            ])
            ->values()
            ->all();
    }

    /**
     * Format a single library member for the export.
     *
     * @param LibraryMember $visitor The library member to format
     * @param string        $type    Either LibraryMember::TYPE_STUDENT or LibraryMember::TYPE_EMPLOYEE
     * @return array              The formatted member data
     */
    private function row(LibraryMember $visitor, string $type): array
    {
        return [
            'school_id' => $visitor->school_id ?? '-',
            'name' => $visitor->full_name,
            'rfid_uid' => $visitor->rfid_uid ?? '-',
            'group' => $this->groupLabel($visitor, $type),
        ];
    }

    /**
     * Get the group label (year/section or department) for a library member.
     *
     * @param LibraryMember $visitor The library member to get the group label for
     * @param string        $type    Either LibraryMember::TYPE_STUDENT or LibraryMember::TYPE_EMPLOYEE
     * @return string              The group label (e.g., "Grade 10 - Section A" or "Computer Science")
     */
    private function groupLabel(LibraryMember $visitor, string $type): string
    {
        if ($type === LibraryMember::TYPE_EMPLOYEE) {
            return $visitor->employee?->department ?: 'Unassigned';
        }

        return trim(collect([$visitor->student?->year_level, $visitor->student?->section])->filter()->implode(' - ')) ?: 'Unassigned';
    }

    /**
     * Get school year data for inclusion in the export payload.
     *
     * @param SchoolYear $schoolYear The school year to get data for
     * @return array               Array containing school year ID, name, start date, and end date
     */
    private function schoolYearData(SchoolYear $schoolYear): array
    {
        return [
            'id' => $schoolYear->id,
            'name' => $schoolYear->name,
            'starts_at' => $schoolYear->startDateString(),
            'ends_at' => $schoolYear->endDateString(),
        ];
    }
}
