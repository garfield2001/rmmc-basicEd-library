<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Models\Employee;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Services\Reports\VisitReportService;
use App\Support\Academics\AcademicLevels;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(ReportFilterRequest $request, VisitReportService $reports): Response
    {
        return Inertia::render('admin/reports', [
            'report' => $reports->getData($request->validated()),
            'reportOptions' => [
                'schoolYears' => SchoolYear::query()->orderByDesc('starts_at')->get(['id', 'name', 'is_active']),
                'yearLevels' => AcademicLevels::options(),
                'sectionsByYearLevel' => $this->sectionsByYearLevel($request->integer('school_year_id') ?: SchoolYear::active()->value('id')),
                'sectionsBySchoolYear' => $this->sectionsBySchoolYear(),
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

    private function sectionsByYearLevel(?int $schoolYearId): array
    {
        if (! $schoolYearId) {
            return [];
        }

        return SchoolYearSection::query()
            ->forSchoolYear($schoolYearId)
            ->orderBy('year_level')
            ->orderBy('name')
            ->get(['year_level', 'name'])
            ->groupBy('year_level')
            ->map(fn ($sections) => $sections->pluck('name')->values()->all())
            ->all();
    }

    private function sectionsBySchoolYear(): array
    {
        return SchoolYearSection::query()
            ->orderBy('school_year_id')
            ->orderBy('year_level')
            ->orderBy('name')
            ->get(['school_year_id', 'year_level', 'name'])
            ->groupBy('school_year_id')
            ->map(fn ($schoolYearSections) => $schoolYearSections
                ->groupBy('year_level')
                ->map(fn ($sections) => $sections->pluck('name')->values()->all())
                ->all())
            ->all();
    }
}
