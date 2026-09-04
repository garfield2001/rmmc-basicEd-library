<?php

namespace App\Http\Controllers;

use App\Exports\Reports\VisitReportExcelExport;
use App\Http\Requests\ReportFilterRequest;
use App\Services\Reports\VisitReportExportService;
use App\Services\Reports\VisitReportService;
use App\Services\Reports\VisitReportWordExportService;
use App\Services\SchoolYears\SchoolYearSectionService;
use App\Support\Reports\ReportPdfBrowser;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\LaravelPdf\Enums\Format;
use Spatie\LaravelPdf\Enums\Unit;
use Spatie\LaravelPdf\Facades\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(ReportFilterRequest $request, VisitReportService $reports, SchoolYearSectionService $sections, ?string $audience = null): Response
    {
        $filters = $request->validated();
        $visitorType = $this->visitorType($audience, $filters['visitor_type'] ?? null);
        $filters['visitor_type'] = $visitorType;

        return Inertia::render('admin/reports', [
            'report' => isset($filters['school_year_id']) ? $reports->getData($filters) : null,
            'initialVisitorType' => $visitorType,
            'pagePath' => route('admin.reports.audience', ['audience' => $this->audienceSlug($visitorType)], false),
            'reportOptions' => $reports->getReportOptions($sections, $request->integer('school_year_id') ?: null),
        ]);
    }

    public function exportCsv(ReportFilterRequest $request, VisitReportService $reports, VisitReportExportService $exports): StreamedResponse
    {
        $report = $reports->getData($request->validated());

        return response()->streamDownload(function () use ($report, $exports): void {
            $file = fopen('php://output', 'w');
            $columns = $exports->columns($report);

            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, ['School year: '.($report['school_year']['name'] ?? 'No school year'), 'Visitor type: '.ucfirst((string) ($report['summary']['visitor_type'] ?? 'visitor')).'s']);
            $isWholeSY = isset($report['school_year']['starts_at'], $report['school_year']['ends_at'])
                && $report['filters']['start_date'] === $report['school_year']['starts_at']
                && $report['filters']['end_date'] === $report['school_year']['ends_at'];

            fputcsv($file, [
                $isWholeSY
                    ? 'Period: Whole school year'
                    : 'Period: From '.$report['filters']['start_date'].' to '.$report['filters']['end_date'],
            ]);

            $groupPrefix = $exports->groupPrefix($report);

            foreach ($exports->groups($report) as $group) {
                fputcsv($file, []);
                fputcsv($file, [$groupPrefix.': '.$group['label']]);
                fputcsv($file, array_column($columns, 'label'));

                foreach ($group['rows'] as $index => $row) {
                    fputcsv($file, $exports->row($columns, $report, $row, $index));
                }
            }

            fclose($file);
        }, $exports->filename($report, 'csv'), [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function exportExcel(ReportFilterRequest $request, VisitReportService $reports, VisitReportExportService $exports)
    {
        $report = $reports->getData($request->validated());

        return Excel::download(
            new VisitReportExcelExport($report, $exports->groups($report)),
            $exports->filename($report, 'xlsx'),
            ExcelFormat::XLSX,
        );
    }

    public function exportWord(ReportFilterRequest $request, VisitReportService $reports, VisitReportExportService $exports, VisitReportWordExportService $word)
    {
        $report = $reports->getData($request->validated());

        return $word->download($report, $exports->groups($report), $exports->filename($report, 'docx'));
    }

    public function exportPdf(ReportFilterRequest $request, VisitReportService $reports, VisitReportExportService $exports, ReportPdfBrowser $browser)
    {
        $report = $reports->getData($request->validated());

        return Pdf::view('reports.visits-print', $exports->viewData($report, showActions: false))
            ->format(Format::Letter)
            ->margins(0.45, 0.55, 0.72, 0.55, Unit::Inch)
            ->footerView('reports.partials.pdf-footer')
            ->portrait()
            ->withBrowsershot(fn ($pdfBrowser) => $browser->configure($pdfBrowser))
            ->download($exports->filename($report, 'pdf'));
    }

    public function print(ReportFilterRequest $request, VisitReportService $reports, VisitReportExportService $exports): HttpResponse
    {
        $report = $reports->getData($request->validated());

        return response()->view('reports.visits-print', $exports->viewData($report));
    }

    private function visitorType(?string $audience, ?string $fallback): string
    {
        return match ($audience) {
            'employees' => 'employee',
            'students' => 'student',
            default => $fallback === 'employee' ? 'employee' : 'student',
        };
    }

    private function audienceSlug(string $type): string
    {
        return $type === 'employee' ? 'employees' : 'students';
    }
}
