import { Button } from '@/components/ui/button';
import type { VisitReport, VisitReportRow, VisitReportSchoolYear } from '@/types/reports';
import { Activity, BarChart3, Target, UsersRound } from 'lucide-react';
import * as React from 'react';
import { ReportAnalysisSummary } from './report-analysis-summary';
import type { ReportSortColumn, SortDirection, VisitorType } from './report-helpers';
import { ReportMetricCard } from './report-metric-card';
import { ReportResultsTable } from './report-results-table';
import { ProgressBar } from './report-table-parts';
import { StudentReportSummaryDialog } from './student-report-summary-dialog';

interface ReportExportUrls {
    excelUrl: string;
    wordUrl: string;
    pdfUrl: string;
    printUrl: string;
    csvUrl: string;
}

interface ReportResultsProps {
    report: VisitReport;
    visitorType: VisitorType;
    selectedSchoolYear: VisitReportSchoolYear | null;
    dateRangeSummary: string;
    exportUrls: ReportExportUrls;
    sortColumn: ReportSortColumn | null;
    sortDirection: SortDirection;
    visibleRows: VisitReportRow[];
    currentPage: number;
    totalPages: number;
    fromRow: number;
    toRow: number;
    totalRows: number;
    onSortChange: (column: ReportSortColumn) => void;
    onClearSort: () => void;
    onPageChange: (page: number) => void;
}

export function ReportResults({
    report,
    visitorType,
    selectedSchoolYear,
    dateRangeSummary,
    exportUrls,
    sortColumn,
    sortDirection,
    visibleRows,
    currentPage,
    totalPages,
    fromRow,
    toRow,
    totalRows,
    onSortChange,
    onClearSort,
    onPageChange,
}: ReportResultsProps) {
    const [showSummaryDialog, setShowSummaryDialog] = React.useState(false);

    return (
        <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ReportMetricCard icon={UsersRound} label={visitorType === 'student' ? 'Students' : 'Employees'} value={report.summary.visitors} />
                <ReportMetricCard
                    icon={Activity}
                    label="Visits recorded"
                    value={report.summary.total_visits}
                    detail={`${report.summary.average_visits} average, ${report.summary.required_visits} target`}
                />
                <ReportMetricCard
                    icon={Target}
                    label="Excess visits"
                    value={report.summary.excess_visits}
                    detail="Visits beyond the required target"
                />
                <ReportMetricCard
                    icon={Target}
                    label="No visits"
                    value={report.summary.unvisited_visitors}
                    detail={`${report.summary.progress_percent}% overall progress`}
                />
            </section>

            <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-semibold tracking-normal text-[#010440]">
                                School year: {report.school_year?.name ?? selectedSchoolYear?.name ?? 'No school year selected'}
                            </h2>
                            {visitorType === 'student' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowSummaryDialog(true)}
                                    className="inline-flex items-center gap-1.5 border-[#040DBF]/25 bg-[#f6f8ff] text-[#040DBF] hover:bg-[#040DBF]/10 hover:text-[#010440] font-semibold shadow-xs"
                                >
                                    <BarChart3 className="size-4 text-[#040DBF]" />
                                    Show Summary
                                </Button>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-[#020659]/70">From {dateRangeSummary}</p>
                    </div>
                    <div className="min-w-64">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium text-[#020659]">Overall required progress</span>
                            <span className="font-semibold text-[#010440]">{report.summary.progress_percent}%</span>
                        </div>
                        <ProgressBar value={report.summary.progress_percent} className="mt-2" />
                    </div>
                </div>
            </section>

            {visitorType !== 'student' && (
                <ReportAnalysisSummary comparison={report.comparison} visitorType={visitorType} />
            )}

            <ReportResultsTable
                visitorType={visitorType}
                requiredVisits={report.summary.required_visits}
                exportUrls={exportUrls}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                visibleRows={visibleRows}
                currentPage={currentPage}
                totalPages={totalPages}
                fromRow={fromRow}
                toRow={toRow}
                totalRows={totalRows}
                onSortChange={onSortChange}
                onClearSort={onClearSort}
                onPageChange={onPageChange}
            />

            {visitorType === 'student' && (
                <StudentReportSummaryDialog
                    open={showSummaryDialog}
                    onOpenChange={setShowSummaryDialog}
                    report={report}
                    dateRangeSummary={dateRangeSummary}
                />
            )}
        </>
    );
}
