import type { VisitReport, VisitReportRow, VisitReportSchoolYear } from '@/types/reports';
import { Activity, Target, UsersRound, UserX } from 'lucide-react';
import { ReportAnalysisSummary } from './report-analysis-summary';
import type { ReportSortColumn, SortDirection, VisitorType } from './report-helpers';
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
            {/* Unified School Year Summary & Metrics Strip (Zero Cards) */}
            <section className="admin-surface rounded-xl border border-[#040DBF]/10 bg-white/95 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-[#010440] dark:text-white">
                            School year: {report.school_year?.name ?? selectedSchoolYear?.name ?? 'No school year selected'}
                        </h2>
                        <p className="mt-0.5 text-xs text-[#020659]/70 dark:text-slate-400">Date range: {dateRangeSummary}</p>
                    </div>

                    <div className="w-full lg:w-80 shrink-0">
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Overall Target Progress</span>
                            <span className="font-bold text-[#010440] dark:text-white">
                                {report.summary.met_required.toLocaleString()} / {report.summary.visitors.toLocaleString()} ({report.summary.progress_percent}%)
                            </span>
                        </div>
                        <ProgressBar value={report.summary.progress_percent} className="mt-1.5" />
                    </div>
                </div>

                {/* Inline Metrics Strip */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-xs">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        {/* 1. Total Visitors */}
                        <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-full bg-blue-50 text-[#040DBF] dark:bg-blue-950/50 dark:text-blue-400">
                                <UsersRound className="size-3.5" />
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {visitorType === 'student' ? 'Students:' : 'Employees:'}
                            </span>
                            <span className="font-extrabold text-[#010440] dark:text-white">
                                {report.summary.visitors.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                ({report.summary.visited_visitors.toLocaleString()} active)
                            </span>
                        </div>

                        <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                        {/* 2. Visits Recorded */}
                        <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <Activity className="size-3.5" />
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Visits recorded:</span>
                            <span className="font-extrabold text-[#010440] dark:text-white">
                                {report.summary.total_visits.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                (avg {report.summary.average_visits})
                            </span>
                        </div>

                        <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                        {/* 3. Target Quota Met */}
                        <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <Target className="size-3.5" />
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Target quota met:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                {report.summary.met_required.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                ({Math.round((report.summary.met_required / (report.summary.visitors || 1)) * 100)}%)
                            </span>
                        </div>

                        <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                        {/* 4. No Visits */}
                        <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                <UserX className="size-3.5" />
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">No visits:</span>
                            <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                {report.summary.unvisited_visitors.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                ({Math.round((report.summary.unvisited_visitors / (report.summary.visitors || 1)) * 100)}%)
                            </span>
                        </div>
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
