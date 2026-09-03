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
            $groupPrefix = $groupPrefix ?? (($report['summary']['visitor_type'] ?? null) === 'student' ? 'Year & Section' : 'Department');
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
            @php
                $isWholeSchoolYear = isset($report['school_year']['starts_at'], $report['school_year']['ends_at'])
                    && $report['filters']['start_date'] === $report['school_year']['starts_at']
                    && $report['filters']['end_date'] === $report['school_year']['ends_at'];
            @endphp

            <section class="meta-grid">
                <div><span class="meta-label">School Year:</span> {{ $report['school_year']['name'] ?? 'No school year' }}</div>
                <div><span class="meta-label">Visitor Type:</span> {{ $visitorType }}</div>
                @if ($isWholeSchoolYear)
                    <div><span class="meta-label">Period:</span> Whole School Year</div>
                @else
                    <div><span class="meta-label">From:</span> {{ $fromDate }}</div>
                    <div><span class="meta-label">To:</span> {{ $toDate }}</div>
                @endif
            </section>

            @php
                $topVisits = $groupComparison['top_by_visits'] ?? [];
                $topCompletion = $groupComparison['top_by_completion'] ?? [];
            @endphp



            @php $colTotal = collect($columns)->sum(fn ($c) => (float) $c['width']); @endphp
            @foreach ($groups as $group)
                <section class="report-group">
                <div class="group-title">{{ $groupPrefix }}: {{ $group['label'] }}</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            @foreach ($columns as $column)
                                <th style="width: {{ round(rtrim($column['width'], 'in') / $colTotal * 100, 1) }}%">{{ $column['label'] }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($group['rows'] as $index => $row)
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
                </table>
                </section>
            @endforeach

            @if (count($topVisits) > 1)
                <div style="page-break-before: always;"></div>
                <section class="comparison-summary" style="margin-bottom: 24px; break-inside: avoid;">
                    <h2>Analysis Summary: Top {{ $groupPrefix }}s by Total Visits</h2>
                    <p>Ranked by highest total volume of library visits in the selected date range</p>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th style="width: 10%; text-align: center;">Rank</th>
                                <th style="width: 36%;">{{ $groupPrefix }}</th>
                                <th style="width: 18%; text-align: center;">Total Visits</th>
                                <th style="width: 18%; text-align: center;">Visit Share</th>
                                <th style="width: 18%; text-align: center;">Average Visits</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($topVisits as $index => $item)
                                <tr>
                                    <td style="text-align: center; font-weight: 700; color: #1e40af;">#{{ $index + 1 }}</td>
                                    <td style="font-weight: 600; color: #111827;">{{ $item['label'] }}</td>
                                    <td style="text-align: center; font-weight: 600;">{{ $item['total_visits'] }} visits</td>
                                    <td style="text-align: center;">{{ $item['visit_share_percent'] }}%</td>
                                    <td style="text-align: center;">{{ $item['average_visits'] }} avg</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </section>

                <section class="comparison-summary" style="margin-bottom: 24px; break-inside: avoid;">
                    <h2>Analysis Summary: Top {{ $groupPrefix }}s by Target Completion Rate</h2>
                    <p>Ranked by percentage of members meeting the target required visit quota</p>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th style="width: 10%; text-align: center;">Rank</th>
                                <th style="width: 36%;">{{ $groupPrefix }}</th>
                                <th style="width: 18%; text-align: center;">Completion Rate</th>
                                <th style="width: 18%; text-align: center;">Met Target</th>
                                <th style="width: 18%; text-align: center;">Average Visits</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($topCompletion as $index => $item)
                                <tr>
                                    <td style="text-align: center; font-weight: 700; color: #047857;">#{{ $index + 1 }}</td>
                                    <td style="font-weight: 600; color: #111827;">{{ $item['label'] }}</td>
                                    <td style="text-align: center; font-weight: 600; color: #047857;">{{ $item['completion_percent'] }}%</td>
                                    <td style="text-align: center;">{{ $item['met_required'] }} / {{ $item['visitors'] }}</td>
                                    <td style="text-align: center;">{{ $item['average_visits'] }} avg</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </section>
            @endif
        </main>

        @if ($showActions ?? true)
            @include('reports.partials.print-page-number-script')
        @endif
    </body>
</html>
