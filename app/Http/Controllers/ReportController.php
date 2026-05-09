<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Models\Employee;
use App\Models\SchoolYear;
use App\Services\Reports\VisitReportService;
use App\Services\SchoolYears\SchoolYearSectionService;
use App\Support\Academics\AcademicLevels;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(ReportFilterRequest $request, VisitReportService $reports, SchoolYearSectionService $sections): Response
    {
        return Inertia::render('admin/reports', [
            'report' => $reports->getData($request->validated()),
            'reportOptions' => [
                'schoolYears' => SchoolYear::query()->orderByDesc('starts_at')->get(['id', 'name', 'is_active']),
                'yearLevels' => AcademicLevels::options(),
                'sectionsByYearLevel' => $sections->groupedByYearLevel($request->integer('school_year_id') ?: SchoolYear::active()->value('id')),
                'sectionsBySchoolYear' => $sections->groupedBySchoolYear(),
                'departments' => Employee::query()->distinct()->orderBy('department')->pluck('department')->values(),
            ],
        ]);
    }

    public function exportCsv(ReportFilterRequest $request, VisitReportService $reports): StreamedResponse
    {
        $report = $reports->getData($request->validated());

        return response()->streamDownload(function () use ($report): void {
            $file = fopen('php://output', 'w');

            fputcsv($file, ['Visited At', 'School Year', 'School ID', 'Name', 'Type', 'Year Level', 'Section', 'Department']);

            foreach ($report['rows'] as $row) {
                fputcsv($file, [
                    $row['visited_at'],
                    $row['school_year'],
                    $row['school_id'],
                    $row['name'],
                    $row['type'],
                    $row['year_level'],
                    $row['section'],
                    $row['department'],
                ]);
            }

            fclose($file);
        }, 'library-visits.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function exportExcel(ReportFilterRequest $request, VisitReportService $reports): HttpResponse
    {
        return response()
            ->view('reports.visits-export-table', [
                'report' => $reports->getData($request->validated()),
            ])
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="library-visits.xls"');
    }

    public function exportWord(ReportFilterRequest $request, VisitReportService $reports): HttpResponse
    {
        return response()
            ->view('reports.visits-export-table', [
                'report' => $reports->getData($request->validated()),
            ])
            ->header('Content-Type', 'application/msword')
            ->header('Content-Disposition', 'attachment; filename="library-visits.doc"');
    }

    public function print(ReportFilterRequest $request, VisitReportService $reports): HttpResponse
    {
        return response()->view('reports.visits-print', [
            'report' => $reports->getData($request->validated()),
        ]);
    }
}
