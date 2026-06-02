<?php

namespace App\Services\Reports\Exports;

use App\Models\LibraryMember;
use App\Services\Reports\VisitReportExportService;
use App\Services\Reports\VisitReportService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Service responsible for preparing data payloads for exporting visit logs and progress reports.
 * Handles the formatting and filtering of visit data for Excel/CSV/Word exports in the admin panel.
 */
class AdminVisitPageExportService
{
    /**
     * Create a new service instance.
     *
     * @param VisitReportService $reports          Service for retrieving visit report data
     * @param VisitReportExportService $grouping   Service for grouping visit data
     */
    public function __construct(
        private readonly VisitReportService $reports,
        private readonly VisitReportExportService $grouping,
    ) {}

    /**
     * Prepare data payload for visit logs export.
     *
     * @param array $filters The filter criteria (search, status, sort, etc.)
     * @return array         The formatted payload ready for export
     */
    public function logs(array $filters): array
    {
        return $this->payload($filters, 'logs', 'Visit Logs', fn (Collection $rows): Collection => $rows->where('visit_count', '>', 0));
    }

    /**
     * Prepare data payload for visit progress export.
     *
     * @param array $filters The filter criteria (search, status, sort, etc.)
     * @return array         The formatted payload ready for export
     */
    public function progress(array $filters): array
    {
        return $this->payload($filters, 'progress', 'Visit Progress', fn (Collection $rows): Collection => $rows);
    }

    /**
     * Prepare the base payload data for either logs or progress export.
     *
     * @param array   $filters  The filter criteria
     * @param string  $mode     Either 'logs' or 'progress'
     * @param string  $title    The base title for the export
     * @param callable $baseRows Callback to filter the base rows
     * @return array            The complete payload data
     */
    private function payload(array $filters, string $mode, string $title, callable $baseRows): array
    {
        $report = $this->reports->getData($filters);
        $rows = $baseRows(collect($report['rows']));
        $rows = $this->applySearch($rows, (string) ($filters['search'] ?? ''));
        $rows = $this->applyStatus($rows, $mode, (string) ($filters['status'] ?? 'all'), (int) ($report['summary']['required_visits'] ?? 0));
        $report['rows'] = $this->sortRows($rows, (string) ($filters['sort'] ?? 'lastVisit'), (string) ($filters['direction'] ?? 'desc'))->values()->all();

        return [
            'title' => ucfirst($report['summary']['visitor_type'])." {$title}",
            'sheet_title' => $title,
            'filename_slug' => $report['summary']['visitor_type'].'-'.$mode,
            'visitor_label' => ucfirst($report['summary']['visitor_type']).'s',
            'group_label' => $report['summary']['visitor_type'] === LibraryMember::TYPE_STUDENT ? 'Year & Section' : 'Department',
            'date_range' => $this->date($report, 'start_date').' to '.$this->date($report, 'end_date'),
            'filters' => $report['filters'],
            'school_year' => $report['school_year'],
            'columns' => $this->columns($mode),
            'groups' => $this->groups($report, $mode),
        ];
    }

    /**
     * Define the column structure for the export based on mode.
     *
     * @param string $mode Either 'logs' or 'progress'
     * @return array       Array of column definitions with keys, labels, and Excel widths
     */
    private function columns(string $mode): array
    {
        return $mode === 'logs'
            ? [
                ['key' => 'school_id', 'label' => 'School ID', 'excel_width' => 18],
                ['key' => 'name', 'label' => 'Name', 'excel_width' => 34],
                ['key' => 'visits', 'label' => 'Visits', 'excel_width' => 14],
                ['key' => 'progress', 'label' => 'Progress', 'excel_width' => 14],
                ['key' => 'last_visit', 'label' => 'Last Visit', 'excel_width' => 22],
            ]
            : [
                ['key' => 'school_id', 'label' => 'School ID', 'excel_width' => 18],
                ['key' => 'name', 'label' => 'Name', 'excel_width' => 34],
                ['key' => 'visits', 'label' => 'Visits', 'excel_width' => 14],
                ['key' => 'remaining', 'label' => 'Remaining', 'excel_width' => 14],
                ['key' => 'last_visit', 'label' => 'Last Visit', 'excel_width' => 22],
                ['key' => 'progress', 'label' => 'Progress', 'excel_width' => 14],
            ];
    }

    /**
     * Group the report data by year/section or department based on visitor type.
     *
     * @param array  $report The visit report data
     * @param string $mode   Either 'logs' or 'progress'
     * @return array         Array of grouped data with rows and summary statistics
     */
    private function groups(array $report, string $mode): array
    {
        return collect($this->grouping->groups($report))->map(function (array $group) use ($mode, $report): array {
            $required = (int) ($report['summary']['required_visits'] ?? 0);
            $group['rows'] = collect($group['rows'])->map(fn (array $row): array => $this->row($row, $required, $mode))->all();
            $group['summary'] = [
                ['label' => 'Visitors', 'value' => count($group['rows'])],
                ['label' => 'Total Visits', 'value' => collect($group['rows'])->sum('visit_count')],
                ['label' => 'Excess Visits', 'value' => collect($group['rows'])->sum('excess_visits')],
            ];

            return $group;
        })->all();
    }

    /**
     * Format a single row of data for the export.
     *
     * @param array  $row    The raw data row from the report
     * @param int    $required The required number of visits
     * @param string $mode   Either 'logs' or 'progress'
     * @return array         The formatted row data
     */
    private function row(array $row, int $required, string $mode): array
    {
        $visits = (int) ($row['visit_count'] ?? 0);
        $base = [
            'school_id' => $row['school_id'] ?? '',
            'name' => $row['name'] ?? '',
            'visits' => "{$visits} / {$required}",
            'progress' => ($row['progress_percent'] ?? 0).'%',
            'last_visit' => $this->lastVisit($row['last_visit_at'] ?? null),
            'visit_count' => $visits,
            'excess_visits' => (int) ($row['excess_visits'] ?? 0),
        ];

        return $mode === 'progress' ? $base + ['remaining' => max(0, $required - $visits)] : $base;
    }

    /**
     * Apply search filtering to the collection of rows.
     *
     * @param Collection $rows  The rows to filter
     * @param string     $search The search term to match against
     * @return Collection      The filtered collection
     */
    private function applySearch(Collection $rows, string $search): Collection
    {
        $search = mb_strtolower(trim($search));

        return $search === '' ? $rows : $rows->filter(fn (array $row): bool => str_contains(mb_strtolower(implode(' ', array_filter([
            $row['school_id'] ?? '', $row['name'] ?? '', $row['year_level'] ?? '', $row['section'] ?? '', $row['department'] ?? '',
        ]))), $search));
    }

    /**
     * Apply status filtering to the collection of rows.
     *
     * @param Collection $rows  The rows to filter
     * @param string     $mode  Either 'logs' or 'progress'
     * @param string     $status The status filter to apply
     * @param int        $required The required number of visits
     * @return Collection      The filtered collection
     */
    private function applyStatus(Collection $rows, string $mode, string $status, int $required): Collection
    {
        if ($status === 'all' || $required <= 0) {
            return $rows;
        }

        return $rows->filter(function (array $row) use ($mode, $status, $required): bool {
            $visits = (int) ($row['visit_count'] ?? 0);

            return $mode === 'logs'
                ? match ($status) {
                    'below' => $visits > 0 && $visits < $required,
                    'met' => $visits >= $required,
                    'excess' => $visits > $required,
                    default => true,
                }
                : match ($status) {
                    'no-visits' => $visits === 0,
                    'complete' => $visits >= $required,
                    'in-progress' => $visits > 0 && $visits < $required,
                    default => true,
                };
        });
    }

    /**
     * Sort the collection of rows based on the specified criteria.
     *
     * @param Collection $rows    The rows to sort
     * @param string     $sort    The field to sort by ('schoolId', 'name', 'group', 'visitCount', or default to last visit)
     * @param string     $direction The sort direction ('asc' or 'desc')
     * @return Collection         The sorted collection
     */
    private function sortRows(Collection $rows, string $sort, string $direction): Collection
    {
        $sorted = $rows->sortBy(fn (array $row): mixed => match ($sort) {
            'schoolId' => $row['school_id'] ?? '',
            'name' => ($row['last_name'] ?? '').' '.($row['first_name'] ?? ''),
            'group' => ($row['year_section_label'] ?? $row['department'] ?? ''),
            'visitCount' => (int) ($row['visit_count'] ?? 0),
            default => $row['last_visit_at'] ?? '',
        }, SORT_NATURAL | SORT_FLAG_CASE);

        return $direction === 'asc' ? $sorted : $sorted->reverse();
    }

    /**
     * Format a date string for display in exports.
     *
     * @param array  $report The report data containing filters
     * @param string $key    The filter key ('start_date' or 'end_date')
     * @return string        The formatted date string (e.g., "Jan 15, 2024")
     */
    private function date(array $report, string $key): string
    {
        return Carbon::parse($report['filters'][$key])->format('M j, Y');
    }

    /**
     * Format a last visit timestamp for display in exports.
     *
     * @param string|null $date The last visit timestamp or null
     * @return string         The formatted date/time string or '-' if null
     */
    private function lastVisit(?string $date): string
    {
        return $date ? Carbon::parse($date)->format('M j, Y g:i A') : '-';
    }
}
