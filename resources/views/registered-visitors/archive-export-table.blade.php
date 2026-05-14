<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Archived Registered Visitors</title>
    </head>
    <body>
        <table>
            <thead>
                <tr>
                    <th>Archived At</th>
                    <th>School ID</th>
                    <th>RFID UID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Year Level</th>
                    <th>Section</th>
                    <th>Department</th>
                    <th>Status Before Archive</th>
                    <th>Visit School Year</th>
                    <th>Visited At</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($visitors as $visitor)
                    @forelse ($visitor->visits as $visit)
                        <tr>
                            <td>{{ optional($visitor->deleted_at)->format('Y-m-d H:i:s') }}</td>
                            <td>{{ $visitor->school_id }}</td>
                            <td>{{ $visitor->rfid_uid }}</td>
                            <td>{{ $visitor->full_name }}</td>
                            <td>{{ $visitor->type }}</td>
                            <td>{{ $visitor->student?->year_level }}</td>
                            <td>{{ $visitor->student?->section }}</td>
                            <td>{{ $visitor->employee?->department }}</td>
                            <td>{{ $visitor->is_active ? 'Active' : 'Inactive' }}</td>
                            <td>{{ $visit->schoolYear?->name }}</td>
                            <td>{{ optional($visit->visited_at)->format('Y-m-d H:i:s') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td>{{ optional($visitor->deleted_at)->format('Y-m-d H:i:s') }}</td>
                            <td>{{ $visitor->school_id }}</td>
                            <td>{{ $visitor->rfid_uid }}</td>
                            <td>{{ $visitor->full_name }}</td>
                            <td>{{ $visitor->type }}</td>
                            <td>{{ $visitor->student?->year_level }}</td>
                            <td>{{ $visitor->student?->section }}</td>
                            <td>{{ $visitor->employee?->department }}</td>
                            <td>{{ $visitor->is_active ? 'Active' : 'Inactive' }}</td>
                            <td></td>
                            <td></td>
                        </tr>
                    @endforelse
                @endforeach
            </tbody>
        </table>
    </body>
</html>
