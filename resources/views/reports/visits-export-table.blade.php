<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Library Visit Report</title>
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
    <h1>Library Visit Report</h1>
    <p>{{ $report['filters']['start_date'] }} to {{ $report['filters']['end_date'] }}</p>

    <table>
        <thead>
            <tr>
                <th>Visited At</th>
                <th>School Year</th>
                <th>School ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Year Level</th>
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
                    <td>{{ $row['year_level'] }}</td>
                    <td>{{ $row['section'] }}</td>
                    <td>{{ $row['department'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
