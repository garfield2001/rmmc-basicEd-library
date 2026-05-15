<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Library Progress Report</title>
    <style>
        @page { size: 8.5in 11in; margin: 0.55in; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { margin: 0 0 8px; color: #4b5563; }
        .meta { margin: 8px 0 16px; font-size: 12px; }
        .meta strong { color: #111827; }
        .summary { margin: 16px 0; border: 0; }
        .summary td { border: 0; font-weight: 700; padding: 4px 16px 4px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
        th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; vertical-align: top; word-wrap: break-word; }
        th { background: #eef2ff; color: #111827; font-weight: 700; }
        .text-cell { mso-number-format: '\@'; }
    </style>
</head>
<body>
    @php
        $columns ??= [];
    @endphp

    <h1>Library Progress Report</h1>
    <div class="meta">
        <p><strong>School year:</strong> {{ $report['school_year']['name'] ?? 'No school year' }} &nbsp;&nbsp; <strong>Visitor type:</strong> {{ ucfirst($report['summary']['visitor_type']) }}s</p>
        <p><strong>From</strong> {{ $report['filters']['start_date'] }} <strong>to</strong> {{ $report['filters']['end_date'] }}</p>
    </div>

    <table class="summary">
        <tbody>
            <tr>
                <td>Visitors: {{ $report['summary']['visitors'] }}</td>
                <td>Total Visits: {{ $report['summary']['total_visits'] }}</td>
                <td>Required Visits: {{ $report['summary']['required_visits'] }}</td>
            </tr>
        </tbody>
    </table>

    <table>
        <thead>
            <tr>
                @foreach ($columns as $column)
                    <th style="width: {{ $column['width'] }}">{{ $column['label'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($report['rows'] as $row)
                <tr>
                    @foreach ($columns as $column)
                        <td class="{{ in_array($column['key'], ['school_id', 'visits'], true) ? 'text-cell' : '' }}">
                            @switch($column['key'])
                                @case('school_year')
                                    {{ $report['school_year']['name'] ?? '' }}
                                    @break
                                @case('school_id')
                                    {{ $row['school_id'] }}
                                    @break
                                @case('name')
                                    {{ $row['name'] }}
                                    @break
                                @case('year_section')
                                    {{ collect([$row['year_level'] ?? null, $row['section'] ?? null])->filter()->implode(' - ') ?: '-' }}
                                    @break
                                @case('department')
                                    {{ $row['department'] ?? '-' }}
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
</body>
</html>
