<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Library Progress Report</title>
    <style>
        @page { size: 11in 8.5in; margin: 0.6in; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 12pt; }
        h1 { font-size: 18pt; margin-bottom: 6pt; }
        p { margin: 0 0 8pt; color: #4b5563; font-size: 12pt; }
        .meta { margin: 8pt 0 16pt; font-size: 12pt; }
        .meta strong { color: #111827; }
        .summary { margin: 16pt 0; border: 0; }
        .summary td { border: 0; font-size: 12pt; font-weight: 700; padding: 4pt 18pt 4pt 0; white-space: nowrap; }
        table { width: 98%; border-collapse: collapse; font-size: 12pt; table-layout: fixed; }
        th, td { border: 1px solid #d1d5db; padding: 7pt 8pt; text-align: left; vertical-align: middle; white-space: nowrap; mso-number-format: '\@'; }
        th { background: #e8eefc; color: #111827; font-size: 12pt; font-weight: 700; }
        tbody tr:nth-child(even) td { background: #f8fafc; }
        tbody tr:nth-child(odd) td { background: #ffffff; }
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
                                    {{ ($row['year_section_label'] ?? collect([$row['year_level'] ?? null, $row['section'] ?? null])->filter()->implode(' - ')) ?: '-' }}
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
