<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ $payload['title'] }}</title>
        @include('reports.partials.print-styles')
    </head>
    <body>
        <main class="report-shell">
            @if ($showActions ?? true)
                <div class="top-actions">
                    <button class="report-action" type="button" onclick="window.print()">Print report</button>
                </div>
            @endif

            @include('reports.partials.report-letterhead')

            <h1>{{ $payload['title'] }}</h1>
            <section class="meta-grid">
                <div><span class="meta-label">School Year:</span> {{ $payload['school_year']['name'] ?? 'No school year' }}</div>
                <div><span class="meta-label">Visitor Type:</span> {{ $payload['visitor_label'] }}</div>
                <div><span class="meta-label">Date Range:</span> {{ $payload['date_range'] }}</div>
            </section>

            @php $colTotal = collect($payload['columns'])->sum(fn ($c) => $c['excel_width'] ?? 18); @endphp
            @foreach ($payload['groups'] as $group)
                <section class="report-group">
                <div class="group-title">{{ $payload['group_label'] }}: {{ $group['label'] }}</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            @foreach ($payload['columns'] as $column)
                                <th style="width: {{ round(($column['excel_width'] ?? 18) / $colTotal * 100, 1) }}%">{{ $column['label'] }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($group['rows'] as $row)
                            <tr>
                                @foreach ($payload['columns'] as $column)
                                    <td>{{ $row[$column['key']] ?? '' }}</td>
                                @endforeach
                            </tr>
                        @empty
                            <tr>
                                <td colspan="{{ count($payload['columns']) }}">No records available.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
                </section>
            @endforeach

            @if (!empty($payload['group_comparison']))
                <section class="pdf-analytics-page">
                    <h2>Analysis Summary</h2>
                    <p class="analytics-subtitle">Comparing metrics across selected groups</p>
                                        <div class="analytics-vertical-chart">
                            <div class="analytics-legend">
                                <span><b class="legend-green"></b> Completion %</span>
                                <span><b class="legend-blue"></b> Visit Share %</span>
                            </div>
                            <div class="comparison-axis">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                            @foreach ($payload['group_comparison'] as $comparison)
                                <div class="comparison-row">
                                    <div class="comparison-label">{{ $comparison['label'] }}</div>
                                    <div class="comparison-bars">
                                        <div class="comparison-bar-line">
                                            <div class="comparison-bar-caption">Completion</div>
                                            <div class="comparison-bar">
                                                <span style="width: {{ min(100, max(0, $comparison['completion_percent'])) }}%;"></span>
                                            </div>
                                            <div class="comparison-value">{{ $comparison['completion_percent'] }}%</div>
                                        </div>
                                        <div class="comparison-bar-line">
                                            <div class="comparison-bar-caption">Visit Share</div>
                                            <div class="comparison-bar comparison-bar-secondary">
                                                <span style="width: {{ min(100, max(0, $comparison['visit_share_percent'])) }}%;"></span>
                                            </div>
                                            <div class="comparison-value">{{ $comparison['visit_share_percent'] }}%</div>
                                        </div>
                                    </div>
                                    <div class="comparison-facts">
                                        {{ $comparison['total_visits'] }} Visits<br>
                                        <span style="font-size: 8pt; color: #6B7280;">{{ $comparison['average_visits'] }} Avg / {{ $comparison['met_required'] }} Met</span>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                </section>
            @endif
        </main>

        @if ($showActions ?? true)
            @include('reports.partials.print-page-number-script')
        @endif
    </body>
</html>
