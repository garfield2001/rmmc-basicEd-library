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
                @foreach ($members as $member)
                    @forelse ($member->visits as $visit)
                        <tr>
                            <td>{{ optional($member->deleted_at)->format('Y-m-d H:i:s') }}</td>
                            <td>{{ $member->school_id }}</td>
                            <td>{{ $member->rfid_uid }}</td>
                            <td>{{ $member->full_name }}</td>
                            <td>{{ $member->type }}</td>
                            <td>{{ $member->student?->year_level }}</td>
                            <td>{{ $member->student?->section }}</td>
                            <td>{{ $member->employee?->department }}</td>
                            <td>{{ $member->is_active ? 'Active' : 'Inactive' }}</td>
                            <td>{{ $visit->schoolYear?->name }}</td>
                            <td>{{ optional($visit->visited_at)->format('Y-m-d H:i:s') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td>{{ optional($member->deleted_at)->format('Y-m-d H:i:s') }}</td>
                            <td>{{ $member->school_id }}</td>
                            <td>{{ $member->rfid_uid }}</td>
                            <td>{{ $member->full_name }}</td>
                            <td>{{ $member->type }}</td>
                            <td>{{ $member->student?->year_level }}</td>
                            <td>{{ $member->student?->section }}</td>
                            <td>{{ $member->employee?->department }}</td>
                            <td>{{ $member->is_active ? 'Active' : 'Inactive' }}</td>
                            <td></td>
                            <td></td>
                        </tr>
                    @endforelse
                @endforeach
            </tbody>
        </table>
    </body>
</html>
