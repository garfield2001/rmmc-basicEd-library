<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Library Progress Report</title>
        @include('reports.partials.print-styles')
    </head>
    <body>
        @php
            $columns ??= [];
            $groups ??= [['label' => 'All visitors', 'rows' => $report['rows']]];
            $visitorType = ucfirst((string) ($report['summary']['visitor_type'] ?? 'visitor'));
            $groupPrefix = ($report['summary']['visitor_type'] ?? null) === 'student' ? 'Year & Section' : 'Department';
            $fromDate = \Carbon\Carbon::parse($report['filters']['start_date'])->format('F j, Y');
            $toDate = \Carbon\Carbon::parse($report['filters']['end_date'])->format('F j, Y');
        @endphp

        <main class="report-shell">
            @if ($showActions ?? true)
                <div class="top-actions">
                    <button class="report-action" type="button" onclick="window.print()">Print report</button>
                </div>
            @endif

            @include('reports.partials.report-letterhead')

            <h1>Library Progress Report</h1>
            <section class="meta-grid">
                <div><span class="meta-label">School Year:</span> {{ $report['school_year']['name'] ?? 'No school year' }}</div>
                <div><span class="meta-label">Visitor Type:</span> {{ $visitorType }}</div>
                <div><span class="meta-label">From:</span> {{ $fromDate }}</div>
                <div><span class="meta-label">To:</span> {{ $toDate }}</div>
            </section>

            @foreach ($groups as $group)
                <div class="group-title">{{ $groupPrefix }}: {{ $group['label'] }}</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            @foreach ($columns as $column)
                                <th style="width: {{ $column['width'] }}">{{ $column['label'] }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($group['rows'] as $row)
                            <tr>
                                @foreach ($columns as $column)
                                    <td>
                                        @switch($column['key'])
                                            @case('school_id')
                                                {{ $row['school_id'] }}
                                                @break
                                            @case('name')
                                                {{ $row['name'] }}
                                                @break
                                            @case('visits')
                                                {{ $row['visit_count'] }} / {{ $report['summary']['required_visits'] }}
                                                @break
                                            @case('excess_visits')
                                                {{ $row['excess_visits'] ?? 0 }}
                                                @break
                                            @case('progress')
                                                {{ $row['progress_percent'] }}%
                                                @break
                                        @endswitch
                                    </td>
                                @endforeach
                            </tr>
                        @endforeach
                    </tbody>
                    <tfoot>
                        <tr class="summary-row">
                            <td>Visitors: {{ $group['summary']['visitors'] ?? count($group['rows']) }}</td>
                            <td class="summary-center">Total Visits: {{ $group['summary']['total_visits'] ?? collect($group['rows'])->sum('visit_count') }}</td>
                            <td>Excess Visits: {{ $group['summary']['excess_visits'] ?? collect($group['rows'])->sum('excess_visits') }}</td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            @endforeach
        </main>

        @if ($showActions ?? true)
            @include('reports.partials.print-page-number-script')
        @endif
    </body>
</html>
