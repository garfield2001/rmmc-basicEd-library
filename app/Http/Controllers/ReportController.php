<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Models\EmployeeProfile;
use App\Models\SchoolYear;
use App\Services\Reports\VisitReportService;
use App\Services\SchoolYears\SchoolYearSectionService;
use App\Support\Academics\AcademicLevels;
use App\Support\Reports\SimpleVisitReportPdf;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(ReportFilterRequest $request, VisitReportService $reports, SchoolYearSectionService $sections): Response
    {
        $filters = $request->validated();

        return Inertia::render('admin/reports', [
            'report' => isset($filters['school_year_id']) ? $reports->getData($filters) : null,
            'reportOptions' => [
                'schoolYears' => SchoolYear::query()
                    ->orderByDesc('starts_at')
                    ->get(['id', 'name', 'starts_at', 'ends_at', 'student_required_visits', 'employee_required_visits', 'is_active'])
                    ->map(fn (SchoolYear $schoolYear): array => [
                        'id' => $schoolYear->id,
                        'name' => $schoolYear->name,
                        'starts_at' => $schoolYear->starts_at->toDateString(),
                        'ends_at' => $schoolYear->ends_at->toDateString(),
                        'student_required_visits' => $schoolYear->student_required_visits,
                        'employee_required_visits' => $schoolYear->employee_required_visits,
                        'is_active' => $schoolYear->is_active,
                    ]),
                'yearLevels' => AcademicLevels::options(),
                'sectionsByYearLevel' => $sections->groupedByYearLevel($request->integer('school_year_id') ?: SchoolYear::active()->value('id')),
                'sectionsBySchoolYear' => $sections->groupedBySchoolYear(),
                'departments' => EmployeeProfile::query()
                    ->when($request->integer('school_year_id'), fn ($query, $schoolYearId) => $query->where('school_year_id', $schoolYearId))
                    ->whereNotNull('department')
                    ->distinct()
                    ->orderBy('department')
                    ->pluck('department')
                    ->values(),
            ],
        ]);
    }

    public function exportCsv(ReportFilterRequest $request, VisitReportService $reports): StreamedResponse
    {
        $report = $reports->getData($request->validated());

        return response()->streamDownload(function () use ($report): void {
            $file = fopen('php://output', 'w');
            $columns = $this->exportColumns($report);

            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, ['School year: '.($report['school_year']['name'] ?? 'No school year'), 'Visitor type: '.ucfirst((string) ($report['summary']['visitor_type'] ?? 'visitor')).'s']);
            fputcsv($file, ['From '.$report['filters']['start_date'].' to '.$report['filters']['end_date']]);
            fputcsv($file, [
                'Visitors: '.$report['summary']['visitors'],
                'Total Visits: '.$report['summary']['total_visits'],
                'Required Visits: '.$report['summary']['required_visits'],
            ]);
            fputcsv($file, []);
            fputcsv($file, array_column($columns, 'label'));

            foreach ($report['rows'] as $row) {
                fputcsv($file, $this->exportRow($columns, $report, $row));
            }

            fclose($file);
        }, $this->exportFilename($report, 'csv'), [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function exportExcel(ReportFilterRequest $request, VisitReportService $reports): HttpResponse
    {
        $report = $reports->getData($request->validated());

        return response()
            ->view('reports.visits-export-table', [
                'report' => $report,
                'columns' => $this->exportColumns($report),
            ])
            ->header('Content-Type', 'application/vnd.ms-excel; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="'.$this->exportFilename($report, 'xls').'"');
    }

    public function exportWord(ReportFilterRequest $request, VisitReportService $reports): HttpResponse
    {
        $report = $reports->getData($request->validated());

        return response()
            ->view('reports.visits-export-table', [
                'report' => $report,
                'columns' => $this->exportColumns($report),
            ])
            ->header('Content-Type', 'application/msword; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="'.$this->exportFilename($report, 'doc').'"');
    }

    public function exportPdf(ReportFilterRequest $request, VisitReportService $reports, SimpleVisitReportPdf $pdf): HttpResponse
    {
        $report = $reports->getData($request->validated());

        return response($pdf->make($report))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="'.$this->exportFilename($report, 'pdf').'"');
    }

    public function print(ReportFilterRequest $request, VisitReportService $reports): HttpResponse
    {
        return response()->view('reports.visits-print', [
            'report' => $reports->getData($request->validated()),
        ]);
    }

    private function exportColumns(array $report): array
    {
        $isStudent = ($report['summary']['visitor_type'] ?? null) === 'student';

        return array_values(array_filter([
            ['key' => 'school_id', 'label' => 'School ID', 'width' => '82pt'],
            ['key' => 'name', 'label' => 'Name', 'width' => '150pt'],
            $isStudent
                ? ['key' => 'year_section', 'label' => 'Year/Section', 'width' => '110pt']
                : ['key' => 'department', 'label' => 'Department', 'width' => '130pt'],
            ['key' => 'visits', 'label' => 'Visits', 'width' => '64pt'],
            ['key' => 'excess_visits', 'label' => 'Excess', 'width' => '58pt'],
            ['key' => 'progress', 'label' => 'Progress', 'width' => '64pt'],
        ]));
    }

    private function exportRow(array $columns, array $report, array $row): array
    {
        return array_map(function (array $column) use ($report, $row): string|int|null {
            return match ($column['key']) {
                'school_year' => $report['school_year']['name'] ?? null,
                'school_id' => $row['school_id'],
                'name' => $row['name'],
                'year_section' => trim(collect([$row['year_level'] ?? null, $row['section'] ?? null])->filter()->implode(' - ')) ?: null,
                'department' => $row['department'],
                'visits' => $row['visit_count'].' / '.($report['summary']['required_visits'] ?? 0),
                'excess_visits' => $row['excess_visits'] ?? 0,
                'progress' => $row['progress_percent'].'%',
                default => null,
            };
        }, $columns);
    }

    private function exportFilename(array $report, string $extension): string
    {
        $schoolYear = Str::slug($report['school_year']['name'] ?? 'no-school-year');
        $visitorType = Str::slug($report['summary']['visitor_type'] ?? 'visitors');
        $startDate = $report['filters']['start_date'] ?? 'start';
        $endDate = $report['filters']['end_date'] ?? 'end';

        return "library-visits-{$schoolYear}-{$visitorType}-{$startDate}-to-{$endDate}.{$extension}";
    }
}
