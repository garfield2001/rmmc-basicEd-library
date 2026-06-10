<?php

namespace App\Services\Reports;

use Illuminate\Support\Str;

class VisitReportExportService
{
    public function columns(array $report, bool $includeGroupColumn = true): array
    {
        $isStudent = ($report['summary']['visitor_type'] ?? null) === 'student';

        if (! $includeGroupColumn) {
            return [
                ['key' => 'school_id', 'label' => 'School ID', 'width' => '1.05in'],
                ['key' => 'name', 'label' => 'Name', 'width' => '3.35in'],
                ['key' => 'visits', 'label' => 'Visits', 'width' => '0.65in'],
                ['key' => 'excess_visits', 'label' => 'Excess', 'width' => '0.70in'],
                ['key' => 'progress', 'label' => 'Progress', 'width' => '0.80in'],
            ];
        }

        return array_values(array_filter([
            ['key' => 'school_id', 'label' => 'School ID', 'width' => '1.15in'],
            ['key' => 'name', 'label' => 'Name', 'width' => '2.45in'],
            $isStudent
                ? ['key' => 'year_section', 'label' => 'Year/Section', 'width' => '2.1in']
                : ['key' => 'department', 'label' => 'Department', 'width' => '2.1in'],
            ['key' => 'visits', 'label' => 'Visits', 'width' => '0.75in'],
            ['key' => 'excess_visits', 'label' => 'Excess', 'width' => '0.8in'],
            ['key' => 'progress', 'label' => 'Progress', 'width' => '0.9in'],
        ]));
    }

    public function groups(array $report): array
    {
        $isStudent = ($report['summary']['visitor_type'] ?? null) === 'student';
        $groups = [];

        foreach ($report['rows'] as $row) {
            $label = $isStudent ? $this->studentGroupLabel($report, $row) : (($row['department'] ?? null) ?: 'Unassigned');

            $groups[$label] ??= ['label' => $label, 'rows' => [], 'summary' => $this->emptyGroupSummary()];
            $groups[$label]['rows'][] = $row;
            $groups[$label]['summary']['visitors']++;
            $groups[$label]['summary']['total_visits'] += (int) ($row['visit_count'] ?? 0);
            $groups[$label]['summary']['excess_visits'] += (int) ($row['excess_visits'] ?? 0);
        }

        return collect($groups)
            ->sortKeysUsing(fn (string $first, string $second): int => strnatcasecmp($first, $second))
            ->values()
            ->all();
    }

    public function row(array $columns, array $report, array $row): array
    {
        return array_map(function (array $column) use ($report, $row): string|int|null {
            return match ($column['key']) {
                'school_year' => $report['school_year']['name'] ?? null,
                'school_id' => $row['school_id'],
                'name' => $row['name'],
                'year_section' => ($row['year_section_label'] ?? trim(collect([$row['year_level'] ?? null, $row['section'] ?? null])->filter()->implode(' - '))) ?: null,
                'department' => $row['department'],
                'visits' => $row['visit_count'].' / '.($report['summary']['required_visits'] ?? 0),
                'excess_visits' => $row['excess_visits'] ?? 0,
                'progress' => $row['progress_percent'].'%',
                default => null,
            };
        }, $columns);
    }

    public function filename(array $report, string $extension): string
    {
        $schoolYear = Str::slug($report['school_year']['name'] ?? 'no-school-year');
        $visitorType = Str::slug($report['summary']['visitor_type'] ?? 'visitors');
        $startDate = $report['filters']['start_date'] ?? 'start';
        $endDate = $report['filters']['end_date'] ?? 'end';

        return "library-visits-{$schoolYear}-{$visitorType}-{$startDate}-to-{$endDate}.{$extension}";
    }

    public function groupSummaryText(array $group): string
    {
        $summary = $group['summary'] ?? $this->emptyGroupSummary();

        return "Visitors: {$summary['visitors']}    Total Visits: {$summary['total_visits']}    Excess Visits: {$summary['excess_visits']}";
    }

    public function viewData(array $report, bool $showActions = true): array
    {
        $groups = $this->groups($report);

        return [
            'report' => $report,
            'columns' => $this->columns($report, includeGroupColumn: false),
            'groups' => $groups,
            'groupPrefix' => $this->groupPrefix($report),
            'groupComparison' => [],
            'logoDataUri' => $this->logoDataUri(),
            'showActions' => $showActions,
            'titleColor' => $this->titleColor(),
        ];
    }

    public function groupPrefix(array $report): string
    {
        if (($report['summary']['visitor_type'] ?? null) !== 'student') {
            return 'Department';
        }

        if (! empty($report['filters']['sections']) || empty($report['filters']['year_levels'])) {
            return 'Year & Section';
        }

        if (count($report['filters']['year_levels'] ?? []) === 1) {
            return 'Section';
        }

        return 'Year Level';
    }

    public function logoDataUri(): ?string
    {
        $path = public_path('images/rmmc-logo.jpg');

        if (! is_file($path)) {
            return null;
        }

        return 'data:image/jpeg;base64,'.base64_encode((string) file_get_contents($path));
    }

    public function titleColor(): string
    {
        return '#010440';
    }

    private function emptyGroupSummary(): array
    {
        return [
            'visitors' => 0,
            'total_visits' => 0,
            'excess_visits' => 0,
            'met_required' => 0,
        ];
    }

    private function studentGroupLabel(array $report, array $row): string
    {
        if (! empty($report['filters']['sections']) || empty($report['filters']['year_levels'])) {
            return ($row['year_section_label'] ?? trim(collect([$row['year_level'] ?? null, $row['section'] ?? null])->filter()->implode(' - '))) ?: 'Unassigned';
        }

        if (count($report['filters']['year_levels'] ?? []) === 1) {
            return ($row['section'] ?? null) ?: 'Unassigned';
        }

        return ($row['year_level'] ?? null) ?: 'Unassigned';
    }
}
