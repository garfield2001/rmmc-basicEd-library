<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Services\Reports\VisitReportService;
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

    public function print(ReportFilterRequest $request, VisitReportService $reports): HttpResponse
    {
        return response()->view('reports.visits-print', [
            'report' => $reports->getData($request->validated()),
        ]);
    }
}
