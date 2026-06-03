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
                <div class="group-summary">
                    @foreach ($group['summary'] as $index => $item)
                        <div @class(['summary-center' => $index === 1])>{{ $item['label'] }}: {{ $item['value'] }}</div>
                    @endforeach
                </div>
            @endforeach
        </main>

        @if ($showActions ?? true)
            @include('reports.partials.print-page-number-script')
        @endif
    </body>
</html>
