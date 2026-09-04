<?php

namespace App\Services\Reports;

use App\Support\Academics\AcademicLevels;
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
        $direction = ($report['filters']['order_direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';
        $groups = [];

        foreach ($report['rows'] as $row) {
            $label = $isStudent ? $this->studentGroupLabel($report, $row) : (($row['department'] ?? null) ?: 'Unassigned');

            $groups[$label] ??= [
                'label' => $label,
                'rows' => [],
                'summary' => $this->emptyGroupSummary(),
                'year_level' => $row['year_level'] ?? null,
                'section' => $row['section'] ?? null,
            ];
            $groups[$label]['rows'][] = $row;
            $groups[$label]['summary']['visitors']++;
            $groups[$label]['summary']['total_visits'] += (int) ($row['visit_count'] ?? 0);
            $groups[$label]['summary']['excess_visits'] += (int) ($row['excess_visits'] ?? 0);

            $requiredVisits = (int) ($report['summary']['required_visits'] ?? 0);
            if ($requiredVisits > 0 && ((int) ($row['visit_count'] ?? 0)) >= $requiredVisits) {
                $groups[$label]['summary']['met_required']++;
            }
        }

        return collect($groups)
            ->sort(function (array $first, array $second) use ($isStudent, $direction): int {
                if ($isStudent) {
                    $firstRank = AcademicLevels::rank($first['year_level'] ?? null) ?? 999;
                    $secondRank = AcademicLevels::rank($second['year_level'] ?? null) ?? 999;

                    if ($firstRank !== $secondRank) {
                        return $direction === 'desc' ? ($secondRank <=> $firstRank) : ($firstRank <=> $secondRank);
                    }

                    $sectionCompare = strnatcasecmp((string) ($first['section'] ?? ''), (string) ($second['section'] ?? ''));
                    if ($sectionCompare !== 0) {
                        return $direction === 'desc' ? -$sectionCompare : $sectionCompare;
                    }
                }

                $labelCompare = strnatcasecmp($first['label'], $second['label']);

                return $direction === 'desc' ? -$labelCompare : $labelCompare;
            })
            ->values()
            ->all();
    }

    public function row(array $columns, array $report, array $row, int $index = 0): array
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

    public function comparison(array $groups, int $overallVisits): array
    {
        if (count($groups) < 2) {
            return [
                'top_by_visits' => [],
                'top_by_completion' => [],
            ];
        }

        $items = collect($groups)->map(function (array $group) use ($overallVisits): array {
            $visitors = $group['summary']['visitors'] ?? 0;
            $totalVisits = $group['summary']['total_visits'] ?? 0;
            $metRequired = $group['summary']['met_required'] ?? 0;

            $completionPercent = $visitors > 0 ? round(($metRequired / $visitors) * 100, 1) : 0;
            $visitSharePercent = $overallVisits > 0 ? round(($totalVisits / $overallVisits) * 100, 1) : 0;
            $averageVisits = $visitors > 0 ? round($totalVisits / $visitors, 1) : 0;

            return [
                'label' => $group['label'],
                'completion_percent' => $completionPercent,
                'visit_share_percent' => $visitSharePercent,
                'total_visits' => $totalVisits,
                'average_visits' => $averageVisits,
                'met_required' => $metRequired,
                'visitors' => $visitors,
            ];
        });

        $topByVisits = $items->sort(function (array $a, array $b): int {
            $visitCompare = $b['total_visits'] <=> $a['total_visits'];
            if ($visitCompare !== 0) {
                return $visitCompare;
            }

            return $b['completion_percent'] <=> $a['completion_percent'];
        })->values()->all();

        $topByCompletion = $items->sort(function (array $a, array $b): int {
            $compCompare = $b['completion_percent'] <=> $a['completion_percent'];
            if ($compCompare !== 0) {
                return $compCompare;
            }

            return $b['total_visits'] <=> $a['total_visits'];
        })->values()->all();

        return [
            'top_by_visits' => $topByVisits,
            'top_by_completion' => $topByCompletion,
        ];
    }

    public function viewData(array $report, bool $showActions = true): array
    {
        $groups = $this->groups($report);
        $overallVisits = max(1, collect($report['rows'])->sum('visit_count'));
        $groupComparison = $this->comparison($groups, $overallVisits);

        return [
            'report' => $report,
            'columns' => $this->columns($report, includeGroupColumn: false),
            'groups' => $groups,
            'groupPrefix' => $this->groupPrefix($report),
            'groupComparison' => $groupComparison,
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

        return 'Year & Section';
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
        return ($row['year_section_label'] ?? trim(collect([$row['year_level'] ?? null, $row['section'] ?? null])->filter()->implode(' - '))) ?: 'Unassigned';
    }
}
