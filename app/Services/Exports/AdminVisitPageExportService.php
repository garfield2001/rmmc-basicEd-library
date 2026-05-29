<?php

namespace App\Services\Exports;

use App\Models\LibraryMember;
use App\Services\Reports\VisitReportExportService;
use App\Services\Reports\VisitReportService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AdminVisitPageExportService
{
    public function __construct(
        private readonly VisitReportService $reports,
        private readonly VisitReportExportService $grouping,
    ) {}

    public function logs(array $filters): array
    {
        return $this->payload($filters, 'logs', 'Visit Logs', fn (Collection $rows): Collection => $rows->where('visit_count', '>', 0));
    }

    public function progress(array $filters): array
    {
        return $this->payload($filters, 'progress', 'Visit Progress', fn (Collection $rows): Collection => $rows);
    }

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

    private function applySearch(Collection $rows, string $search): Collection
    {
        $search = mb_strtolower(trim($search));

        return $search === '' ? $rows : $rows->filter(fn (array $row): bool => str_contains(mb_strtolower(implode(' ', array_filter([
            $row['school_id'] ?? '', $row['name'] ?? '', $row['year_level'] ?? '', $row['section'] ?? '', $row['department'] ?? '',
        ]))), $search));
    }

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

    private function date(array $report, string $key): string
    {
        return Carbon::parse($report['filters'][$key])->format('M j, Y');
    }

    private function lastVisit(?string $date): string
    {
        return $date ? Carbon::parse($date)->format('M j, Y g:i A') : '-';
    }
}
