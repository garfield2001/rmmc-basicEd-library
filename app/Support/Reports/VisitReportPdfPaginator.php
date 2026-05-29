<?php

namespace App\Support\Reports;

use Illuminate\Support\Collection;

class VisitReportPdfPaginator
{
    private const TABLE_TOP = 548;

    private const BOTTOM = 42;

    private const GROUP_HEIGHT = 24;

    private const ROW_HEIGHT = 20;

    public function pages(array $report): array
    {
        $pages = $this->paginateGroups($this->reportGroups($report));

        return $pages === [] ? [[]] : $pages;
    }

    private function paginateGroups(array $groups): array
    {
        $pages = [];
        $items = [];
        $remaining = self::TABLE_TOP - self::BOTTOM;
        $hasRows = false;

        foreach ($groups as $group) {
            $rows = $this->reportRows($group['rows'] ?? []);

            if ($rows === []) {
                continue;
            }

            $stripe = 0;
            $this->addGroupHeader($pages, $items, $remaining, (string) ($group['label'] ?? 'Unassigned'));

            foreach ($rows as $row) {
                if ($remaining < self::ROW_HEIGHT) {
                    $this->commitPage($pages, $items, $remaining);
                    $this->addGroupHeader($pages, $items, $remaining, $group['label'].' (continued)');
                }

                $items[] = ['type' => 'row', 'row' => $row, 'stripe' => $stripe++];
                $remaining -= self::ROW_HEIGHT;
                $hasRows = true;
            }

            if ($remaining < self::GROUP_HEIGHT) {
                $this->commitPage($pages, $items, $remaining);
            }

            $items[] = ['type' => 'summary', 'summary' => $this->groupSummary($rows)];
            $remaining -= self::GROUP_HEIGHT;
        }

        if ($items !== []) {
            $pages[] = $items;
        }

        return $hasRows ? $pages : [[]];
    }

    private function addGroupHeader(array &$pages, array &$items, int &$remaining, string $label): void
    {
        $needed = self::GROUP_HEIGHT + self::ROW_HEIGHT + self::ROW_HEIGHT;

        if ($items !== [] && $remaining < $needed) {
            $this->commitPage($pages, $items, $remaining);
        }

        $items[] = ['type' => 'group', 'label' => $label];
        $remaining -= self::GROUP_HEIGHT;
        $items[] = ['type' => 'header'];
        $remaining -= self::ROW_HEIGHT;
    }

    private function commitPage(array &$pages, array &$items, int &$remaining): void
    {
        if ($items !== []) {
            $pages[] = $items;
        }

        $items = [];
        $remaining = self::TABLE_TOP - self::BOTTOM;
    }

    private function reportGroups(array $report): array
    {
        $prefix = ($report['summary']['visitor_type'] ?? null) === 'student' ? 'Year & Section' : 'Department';

        if (isset($report['groups']) && is_array($report['groups'])) {
            return array_map(fn (array $group): array => [
                'label' => $prefix.': '.(string) ($group['label'] ?? 'Unassigned'),
                'rows' => $this->reportRows($group['rows'] ?? []),
            ], $report['groups']);
        }

        return [['label' => $prefix.': All visitors', 'rows' => $this->reportRows($report['rows'] ?? [])]];
    }

    private function reportRows(mixed $rows): array
    {
        return $rows instanceof Collection ? $rows->values()->all() : (is_array($rows) ? array_values($rows) : []);
    }

    private function groupSummary(array $rows): array
    {
        return [
            'visitors' => count($rows),
            'total_visits' => collect($rows)->sum(fn (array $row): int => (int) ($row['visit_count'] ?? 0)),
            'excess_visits' => collect($rows)->sum(fn (array $row): int => (int) ($row['excess_visits'] ?? 0)),
        ];
    }
}
