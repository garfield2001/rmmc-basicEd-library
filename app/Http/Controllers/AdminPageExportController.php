<?php

namespace App\Http\Controllers;

use App\Exports\Admin\AdminTableExcelExport;
use App\Models\LibraryMember;
use App\Services\Exports\AdminTableExportService;
use App\Services\Exports\AdminTableWordExportService;
use App\Services\Reports\Exports\AdminVisitPageExportService;
use App\Services\Reports\Exports\RegisteredVisitorsExportService;
use App\Support\Reports\ReportPdfBrowser;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\LaravelPdf\Enums\Format;
use Spatie\LaravelPdf\Enums\Unit;
use Spatie\LaravelPdf\Facades\Pdf;

class AdminPageExportController extends Controller
{
    public function show(
        Request $request,
        AdminVisitPageExportService $visits,
        RegisteredVisitorsExportService $registered,
        AdminTableExportService $exports,
        AdminTableWordExportService $word,
        ReportPdfBrowser $browser,
        string $page,
        string $audience,
        string $format,
    ): mixed {
        $filters = $this->filters($request, $audience);
        $payload = match ($page) {
            'visit-logs' => $visits->logs($filters),
            'visit-progress' => $visits->progress($filters),
            default => $registered->payload($filters),
        };

        return match ($format) {
            'xlsx' => Excel::download(new AdminTableExcelExport($payload), $exports->filename($payload, 'xlsx'), ExcelFormat::XLSX),
            'docx' => $word->download($payload, $exports->filename($payload, 'docx')),
            'pdf' => $this->pdf($payload, $exports, $browser),
            default => $this->print($payload, $exports),
        };
    }

    private function filters(Request $request, string $audience): array
    {
        $validated = $request->validate([
            'school_year_id' => ['nullable', Rule::exists('school_years', 'id')],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'year_level' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:32'],
            'sort' => ['nullable', 'string', 'max:32'],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        return $validated + [
            'visitor_type' => $audience === 'employees' ? LibraryMember::TYPE_EMPLOYEE : LibraryMember::TYPE_STUDENT,
        ];
    }

    private function pdf(array $payload, AdminTableExportService $exports, ReportPdfBrowser $browser)
    {
        return Pdf::view('exports.admin-table-print', $exports->viewData($payload, showActions: false))
            ->format(Format::Letter)
            ->margins(0.45, 0.55, 0.72, 0.55, Unit::Inch)
            ->footerView('reports.partials.pdf-footer')
            ->portrait()
            ->withBrowsershot(fn ($pdfBrowser) => $browser->configure($pdfBrowser))
            ->download($exports->filename($payload, 'pdf'));
    }

    private function print(array $payload, AdminTableExportService $exports): HttpResponse
    {
        return response()->view('exports.admin-table-print', $exports->viewData($payload));
    }
}
