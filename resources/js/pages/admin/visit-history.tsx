import { useVisitLogsPage } from '@/components/admin/visit-history/use-visit-logs-page';
import type { VisitorTypeFilter, VisitorWithRangeVisits } from '@/components/admin/visit-history/visit-logs-helpers';
import { VisitProgressRanking } from '@/components/admin/visit-history/visit-progress-ranking';
import { VisitProgressSummaryCards } from '@/components/admin/visit-history/visit-progress-summary-cards';
import { VisitorHistoryModal } from '@/components/admin/visit-history/visitor-history-modal';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitLogs } from '@/types/dashboard';
import { Head } from '@inertiajs/react';

interface VisitHistoryProps {
    visitLogs: AdminVisitLogs;
    initialVisitorType: VisitorTypeFilter;
}

export default function VisitHistory({ visitLogs, initialVisitorType }: VisitHistoryProps) {
    const page = useVisitLogsPage(visitLogs, initialVisitorType);

    const audienceLabel = page.visitorType === 'student' ? 'Student' : 'Employee';
    const audienceClass = page.visitorType === 'student' ? 'visit-history-audience-student' : 'visit-history-audience-employee';
    const visitorCount = page.visitorType === 'student' ? visitLogs.metrics.studentVisitors : visitLogs.metrics.employeeVisitors;
    const requiredVisits =
        page.visitorType === 'student' ? (visitLogs.schoolYear?.student_required_visits ?? 0) : (visitLogs.schoolYear?.employee_required_visits ?? 0);

    const openVisitor = (visitor: VisitorWithRangeVisits) => {
        page.setSelectedVisitor(visitor);
    };

    return (
        <>
            <Head title={`${audienceLabel} Visit History`} />
            <main className="min-h-screen">
                <AdminLayout active="visit-history">
                    <div className="admin-content-shell mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title={`${audienceLabel} Visit History`}
                            description={`Audit exact ${audienceLabel.toLowerCase()} visit records and track required-visit completion for the active school year.`}
                            badge={
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`visit-history-audience-badge ${audienceClass} rounded-full border px-3 py-1 text-xs font-bold shadow-sm`}
                                    >
                                        {visitorCount.toLocaleString()} {audienceLabel.toLowerCase()}
                                        {visitorCount === 1 ? '' : 's'}
                                    </span>
                                    <span className="admin-required-visits-badge rounded-full px-3 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                        {requiredVisits} required visits
                                    </span>
                                </div>
                            }
                            actions={null}
                        />

                        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-stretch">
                            <div className="admin-surface relative order-2 flex w-full flex-col overflow-hidden rounded-xl border border-[#040DBF]/10 bg-white/95 shadow-sm lg:order-1 lg:flex-1 dark:border-slate-800 dark:bg-slate-900">
                                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 dark:from-blue-500 dark:to-indigo-500" />
                                <VisitProgressRanking
                                    visitorType={page.visitorType}
                                    visitors={page.progressVisitors}
                                    requiredVisits={requiredVisits}
                                    search={page.search}
                                    sortColumn={page.sortColumn}
                                    sortDirection={page.sortDirection}
                                    filters={visitLogs.filters}
                                    startDate={page.startDate}
                                    endDate={page.endDate}
                                    schoolYearStart={page.schoolYearStart}
                                    schoolYearEnd={page.schoolYearEnd}
                                    academicDepartment={page.academicDepartment}
                                    yearLevel={page.yearLevel}
                                    section={page.section}
                                    onSearchChange={page.setSearch}
                                    onSortChange={page.changeSort}
                                    onVisitorOpen={openVisitor}
                                    onDateRangeChange={(start, end) => {
                                        page.setStartDate(start);
                                        page.setEndDate(end);
                                    }}
                                    onAcademicDepartmentChange={page.changeAcademicDepartment}
                                    onYearLevelChange={page.changeYearLevel}
                                    onSectionChange={page.setSection}
                                />
                            </div>

                            <div className="admin-surface relative order-1 flex h-[420px] w-full shrink-0 flex-col overflow-hidden rounded-xl border border-[#040DBF]/10 bg-white/95 shadow-sm lg:order-2 lg:h-auto lg:w-80 xl:w-96 dark:border-slate-800 dark:bg-slate-900">
                                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 dark:from-blue-500 dark:to-indigo-500" />
                                <div className="relative flex-1">
                                    <div className="absolute inset-0">
                                        <VisitProgressSummaryCards
                                            visitors={page.summaryCardVisitors}
                                            visitorType={page.visitorType}
                                            requiredVisits={requiredVisits}
                                            onYearLevelChange={page.changeYearLevel}
                                            onSectionChange={page.setSection}
                                            onDepartmentChange={page.setDepartment}
                                            activeYearLevel={page.yearLevel}
                                            activeSection={page.section}
                                            activeDepartment={page.department}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AdminLayout>
            </main>
            {page.selectedVisitor && (
                <VisitorHistoryModal
                    visitor={page.selectedVisitor}
                    visits={page.selectedVisitorVisits}
                    startDate={page.effectiveStartDate}
                    endDate={page.effectiveEndDate}
                    open={Boolean(page.selectedVisitor)}
                    onOpenChange={(open) => {
                        if (!open) {
                            page.setSelectedVisitor(null);
                        }
                    }}
                />
            )}
        </>
    );
}
