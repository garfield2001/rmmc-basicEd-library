<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Library Progress Report</title>
    <style>
        body { font-family: Arial, sans-serif; color: #111827; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        p { margin: 0 0 16px; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #d1d5db; padding: 7px; text-align: left; }
        th { background: #f3f4f6; }
    </style>
</head>
<body>
    <h1>Library Progress Report</h1>
    <p>{{ ucfirst($report['summary']['visitor_type']) }}s · {{ $report['school_year']['name'] ?? 'No school year' }}</p>
    <p>{{ $report['filters']['start_date'] }} to {{ $report['filters']['end_date'] }}</p>

    <table>
        <thead>
            <tr>
                <th>School Year</th>
                <th>School ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Year Level</th>
                <th>Section</th>
                <th>Department</th>
                <th>Visits</th>
                <th>Required Met</th>
                <th>Progress</th>
                <th>Last Visit</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($report['rows'] as $row)
                <tr>
                    <td>{{ $report['school_year']['name'] ?? '' }}</td>
                    <td>{{ $row['school_id'] }}</td>
                    <td>{{ $row['name'] }}</td>
                    <td>{{ $row['type'] }}</td>
                    <td>{{ $row['year_level'] }}</td>
                    <td>{{ $row['section'] }}</td>
                    <td>{{ $row['department'] }}</td>
                    <td>{{ $row['visit_count'] }}</td>
                    <td>{{ $row['required_met'] ? 'Yes' : 'No' }}</td>
                    <td>{{ $row['progress_percent'] }}%</td>
                    <td>{{ $row['last_visit_at'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
