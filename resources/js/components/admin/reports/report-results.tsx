import type { VisitReport, VisitReportRow, VisitReportSchoolYear } from '@/types/reports';
import { Activity, Target, UsersRound } from 'lucide-react';
import { ReportAnalysisSummary } from './report-analysis-summary';
import type { ReportSortColumn, SortDirection, VisitorType } from './report-helpers';
import { ReportMetricCard } from './report-metric-card';
import { ReportResultsTable } from './report-results-table';
import { ProgressBar } from './report-table-parts';
import { StudentSectionReportView } from './student-section/student-section-report-view';

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
    return (
        <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ReportMetricCard
                    icon={UsersRound}
                    label={visitorType === 'student' ? 'Students' : 'Employees'}
                    value={report.summary.visitors}
                    detail={`${report.summary.visited_visitors.toLocaleString()} active (${Math.round((report.summary.visited_visitors / (report.summary.visitors || 1)) * 100)}% participation)`}
                />
                <ReportMetricCard
                    icon={Activity}
                    label="Visits recorded"
                    value={report.summary.total_visits}
                    detail={`${report.summary.average_visits} average • ${report.summary.required_visits} required`}
                />
                <ReportMetricCard
                    icon={Target}
                    label="Target quota met"
                    value={report.summary.met_required}
                    detail={`${Math.round((report.summary.met_required / (report.summary.visitors || 1)) * 100)}% reached ${report.summary.required_visits}+ visits`}
                />
                <ReportMetricCard
                    icon={Target}
                    label="No visits"
                    value={report.summary.unvisited_visitors}
                    detail={`${Math.round((report.summary.unvisited_visitors / (report.summary.visitors || 1)) * 100)}% inactive in this period`}
                />
            </section>

            <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">
                            School year: {report.school_year?.name ?? selectedSchoolYear?.name ?? 'No school year selected'}
                        </h2>
                        <p className="mt-1 text-sm text-[#020659]/70">From {dateRangeSummary}</p>
                    </div>
                    <div className="min-w-72">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium text-[#020659]">Overall required progress</span>
                            <span className="font-semibold text-[#010440]">
                                {report.summary.met_required.toLocaleString()} of {report.summary.visitors.toLocaleString()} (
                                {report.summary.progress_percent}%)
                            </span>
                        </div>
                        <ProgressBar value={report.summary.progress_percent} className="mt-2" />
                    </div>
                </div>
            </section>

            {visitorType === 'student' ? (
                <StudentSectionReportView report={report} exportUrls={exportUrls} />
            ) : (
                <>
                    <ReportAnalysisSummary comparison={report.comparison} visitorType={visitorType} />
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
                </>
            )}
        </>
    );
}
