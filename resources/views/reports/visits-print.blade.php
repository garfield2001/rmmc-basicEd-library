<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Library Progress Report</title>
        <style>
            body {
                color: #111827;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 12px;
                margin: 32px;
            }

            header {
                display: flex;
                justify-content: space-between;
                gap: 24px;
                margin-bottom: 24px;
            }

            h1 {
                font-size: 18px;
                margin: 0 0 6px;
            }

            .report-meta {
                color: #111827;
                display: flex;
                flex-wrap: wrap;
                gap: 8px 20px;
                font-size: 12px;
                font-weight: 700;
                margin-top: 10px;
            }

            .report-range {
                color: #52525b;
                font-size: 12px;
                margin-top: 6px;
            }

            p {
                color: #52525b;
                margin: 0;
            }

            button {
                align-items: center;
                background: #040dbf;
                border: 0;
                border-radius: 8px;
                color: #ffffff;
                cursor: pointer;
                display: inline-flex;
                font-size: 13px;
                font-weight: 700;
                gap: 8px;
                padding: 11px 16px;
                text-decoration: none;
            }

            .actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }

            table {
                border-collapse: collapse;
                font-size: 12px;
                table-layout: fixed;
                width: 100%;
            }

            th,
            td {
                border: 1px solid #d4d4d8;
                padding: 8px;
                text-align: left;
                vertical-align: top;
                white-space: nowrap;
            }

            th {
                background: #e8eefc;
                color: #111827;
            }

            tbody tr:nth-child(even) td {
                background: #f8fafc;
            }

            .summary {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
            }

            .summary div {
                border: 1px solid #d4d4d8;
                border-radius: 10px;
                padding: 12px;
            }

            @media print {
                .actions {
                    display: none;
                }

                body {
                    margin: 0;
                }
            }
        </style>
    </head>
    <body>
        @php
            $isStudentReport = ($report['summary']['visitor_type'] ?? null) === 'student';
            $columns = [
                ['key' => 'school_id', 'label' => 'School ID', 'width' => '14%'],
                ['key' => 'name', 'label' => 'Name', 'width' => '32%'],
                $isStudentReport
                    ? ['key' => 'year_section', 'label' => 'Year/Section', 'width' => '24%']
                    : ['key' => 'department', 'label' => 'Department', 'width' => '24%'],
                ['key' => 'visits', 'label' => 'Visits', 'width' => '11%'],
                ['key' => 'excess_visits', 'label' => 'Excess', 'width' => '9%'],
                ['key' => 'progress', 'label' => 'Progress', 'width' => '10%'],
            ];
        @endphp

        <header>
            <div>
                <h1>Library Progress Report</h1>
                <div class="report-meta">
                    <span>School year: {{ $report['school_year']['name'] ?? 'No school year' }}</span>
                    <span>Visitor type: {{ ucfirst($report['summary']['visitor_type']) }}s</span>
                </div>
                <p class="report-range">From {{ $report['filters']['start_date'] }} to {{ $report['filters']['end_date'] }}</p>
            </div>
            <div class="actions">
                <button onclick="window.print()">Print report</button>
            </div>
        </header>

        <section class="summary">
            <div><strong>{{ $report['summary']['visitors'] }}</strong><br>Visitors</div>
            <div><strong>{{ $report['summary']['total_visits'] }}</strong><br>Total visits</div>
            <div><strong>{{ $report['summary']['required_visits'] }}</strong><br>Required visits</div>
        </section>

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
                            <td>
                                @switch($column['key'])
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
