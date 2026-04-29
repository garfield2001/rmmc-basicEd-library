<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Library Visits Report</title>
        <style>
            body {
                color: #18181b;
                font-family: Arial, sans-serif;
                margin: 32px;
            }

            header {
                display: flex;
                justify-content: space-between;
                gap: 24px;
                margin-bottom: 24px;
            }

            h1 {
                font-size: 24px;
                margin: 0 0 6px;
            }

            p {
                color: #52525b;
                margin: 0;
            }

            button {
                background: #18181b;
                border: 0;
                border-radius: 8px;
                color: #ffffff;
                cursor: pointer;
                padding: 10px 14px;
            }

            table {
                border-collapse: collapse;
                font-size: 12px;
                width: 100%;
            }

            th,
            td {
                border: 1px solid #d4d4d8;
                padding: 8px;
                text-align: left;
            }

            th {
                background: #f4f4f5;
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
                button {
                    display: none;
                }

                body {
                    margin: 0;
                }
            }
        </style>
    </head>
    <body>
        <header>
            <div>
                <h1>Library Visits Report</h1>
                <p>{{ $report['filters']['start_date'] }} to {{ $report['filters']['end_date'] }}</p>
            </div>
            <button onclick="window.print()">Print / Save as PDF</button>
        </header>

        <section class="summary">
            <div><strong>{{ $report['summary']['total'] }}</strong><br>Total visits</div>
            <div><strong>{{ $report['summary']['students'] }}</strong><br>Students</div>
            <div><strong>{{ $report['summary']['employees'] }}</strong><br>Employees</div>
        </section>

        <table>
            <thead>
                <tr>
                    <th>Visited at</th>
                    <th>School year</th>
                    <th>School ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Year level</th>
                    <th>Section</th>
                    <th>Department</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($report['rows'] as $row)
                    <tr>
                        <td>{{ $row['visited_at'] }}</td>
                        <td>{{ $row['school_year'] }}</td>
                        <td>{{ $row['school_id'] }}</td>
                        <td>{{ $row['name'] }}</td>
                        <td>{{ $row['type'] }}</td>
                        <td>{{ $row['year_level'] ?? '-' }}</td>
                        <td>{{ $row['section'] ?? '-' }}</td>
                        <td>{{ $row['department'] ?? '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </body>
</html>
