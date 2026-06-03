<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
    <meta charset="utf-8">
    <title>Library Progress Report</title>
    @verbatim
    <!--[if gte mso 9]>
    <xml>
        <x:ExcelWorkbook>
            <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                    <x:Name>Library Progress Report</x:Name>
                    <x:WorksheetOptions>
                        <x:PageSetup>
                            <x:Layout x:Orientation="Portrait"/>
                            <x:PaperSizeIndex>1</x:PaperSizeIndex>
                            <x:Scale>95</x:Scale>
                        </x:PageSetup>
                        <x:FitToPage/>
                        <x:Print>
                            <x:FitWidth>1</x:FitWidth>
                            <x:FitHeight>0</x:FitHeight>
                            <x:ValidPrinterInfo/>
                            <x:HorizontalResolution>600</x:HorizontalResolution>
                            <x:VerticalResolution>600</x:VerticalResolution>
                        </x:Print>
                    </x:WorksheetOptions>
                </x:ExcelWorksheet>
            </x:ExcelWorksheets>
        </x:ExcelWorkbook>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
        </w:WordDocument>
    </xml>
    <![endif]-->
    @endverbatim
    @include('reports.partials.export-styles')
</head>
<body>
    @php
        $columns ??= [];
        $groups ??= [['label' => 'All visitors', 'rows' => $report['rows']]];
        $visitorType = ucfirst((string) ($report['summary']['visitor_type'] ?? 'visitor'));
        $groupPrefix = ($report['summary']['visitor_type'] ?? null) === 'student' ? 'Year & Section' : 'Department';
        $fromDate = \Carbon\Carbon::parse($report['filters']['start_date'])->format('F j, Y');
        $toDate = \Carbon\Carbon::parse($report['filters']['end_date'])->format('F j, Y');
    @endphp

    <div class="Section1">
        <div class="report-inner">
            @include('reports.partials.report-letterhead')

            <div class="report-title">Library Progress Report</div>

            <table class="meta-table">
                <tbody>
                    <tr>
                        <td><span class="meta-label">School Year:</span> {{ $report['school_year']['name'] ?? 'No school year' }}</td>
                        <td><span class="meta-label">Visitor Type:</span> {{ $visitorType }}</td>
                    </tr>
                    <tr>
                        <td><span class="meta-label">From:</span> {{ $fromDate }}</td>
                        <td><span class="meta-label">To:</span> {{ $toDate }}</td>
                    </tr>
                </tbody>
            </table>

            @php $colTotal = collect($columns)->sum(fn ($c) => (float) rtrim($c['width'] ?? '1in', 'in')); @endphp
            @foreach ($groups as $group)
                <div class="group-title">{{ $groupPrefix }}: {{ $group['label'] }}</div>
                <table class="report-table" align="center">
                    <thead>
                        <tr>
                            @foreach ($columns as $column)
                                <th style="width: {{ round(rtrim($column['width'] ?? '1in', 'in') / $colTotal * 100, 1) }}%">{{ $column['label'] }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($group['rows'] as $row)
                            <tr>
                                @foreach ($columns as $column)
                                    <td class="{{ $column['key'] === 'school_id' ? 'text-cell' : '' }}">
                                        @switch($column['key'])
                                            @case('school_id')
                                                {{ $row['school_id'] }}
                                                @break
                                            @case('name')
                                                {{ $row['name'] }}
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
                <table class="group-summary">
                    <tr>
                        <td>Visitors: {{ $group['summary']['visitors'] ?? count($group['rows']) }}</td>
                        <td class="summary-center">Total Visits: {{ $group['summary']['total_visits'] ?? collect($group['rows'])->sum('visit_count') }}</td>
                        <td>Excess Visits: {{ $group['summary']['excess_visits'] ?? collect($group['rows'])->sum('excess_visits') }}</td>
                    </tr>
                </table>
            @endforeach
        </div>
    </div>
</body>
</html>


