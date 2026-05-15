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

            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, ['School Year', 'School ID', 'Name', 'Type', 'Year Level', 'Section', 'Department', 'Visits', 'Required Met', 'Progress', 'Last Visit']);

            foreach ($report['rows'] as $row) {
                fputcsv($file, [
                    $report['school_year']['name'] ?? null,
                    $row['school_id'],
                    $row['name'],
                    $row['type'],
                    $row['year_level'],
                    $row['section'],
                    $row['department'],
                    $row['visit_count'],
                    $row['required_met'] ? 'Yes' : 'No',
                    $row['progress_percent'].'%',
                    $row['last_visit_at'],
                ]);
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
            'pdfUrl' => route('admin.reports.visits.pdf', $request->query()),
        ]);
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
