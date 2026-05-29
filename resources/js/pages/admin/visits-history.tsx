import { useVisitsHistoryPage } from '@/components/admin/visits-history/use-visits-history-page';
import { PageExportActions } from '@/components/admin/exports/page-export-actions';
import { VisitHistoryFilterPanel } from '@/components/admin/visits-history/visit-history-filter-panel';
import { VisitHistoryInsights } from '@/components/admin/visits-history/visit-history-insights';
import type { VisitorTypeFilter } from '@/components/admin/visits-history/visit-history-helpers';
import { VisitHistoryTable } from '@/components/admin/visits-history/visit-history-table';
import { VisitorHistoryModal } from '@/components/admin/visits-history/visitor-history-modal';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitHistory } from '@/types/dashboard';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface VisitsHistoryProps {
    visitHistory: AdminVisitHistory;
    initialVisitorType: VisitorTypeFilter;
}

export default function VisitsHistory({ visitHistory, initialVisitorType }: VisitsHistoryProps) {
    const historyPage = useVisitsHistoryPage(visitHistory, initialVisitorType);
    const [highlightedVisitorId, setHighlightedVisitorId] = useState<number | null>(null);
    const audienceLabel = historyPage.visitorType === 'student' ? 'Student' : 'Employee';
    const visitorCount = historyPage.visitorType === 'student' ? visitHistory.metrics.studentVisitors : visitHistory.metrics.employeeVisitors;
    const requiredVisits =
        historyPage.visitorType === 'student'
            ? (visitHistory.schoolYear?.student_required_visits ?? 0)
            : (visitHistory.schoolYear?.employee_required_visits ?? 0);

    return (
        <>
            <Head title={`${audienceLabel} Visit Logs`} />
            <main className="min-h-screen">
                <AdminLayout active="visits-history">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title={`${audienceLabel} Visit Logs`}
                            description={`Audit exact ${audienceLabel.toLowerCase()} visit records, timestamps, and date coverage for the active school year.`}
                            badge={
                                <span className="rounded-full border border-[#040DBF]/10 bg-white px-3 py-1 text-sm font-semibold text-[#030A8C] shadow-sm">
                                    {visitorCount.toLocaleString()} {audienceLabel.toLowerCase()}
                                    {visitorCount === 1 ? '' : 's'}
                                </span>
                            }
                            actions={
                                <PageExportActions
                                    page="visit-logs"
                                    audience={historyPage.visitorType === 'student' ? 'students' : 'employees'}
                                    query={{
                                        school_year_id: visitHistory.schoolYear?.id,
                                        start_date: historyPage.effectiveStartDate,
                                        end_date: historyPage.effectiveEndDate,
                                        year_level: historyPage.yearLevel,
                                        section: historyPage.section,
                                        department: historyPage.department,
                                        search: historyPage.search,
                                        status: historyPage.logStatus,
                                        sort: historyPage.sortColumn,
                                        direction: historyPage.sortDirection,
                                    }}
                                />
                            }
                        />

                        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
                            <VisitHistoryTable
                                visitors={historyPage.visibleVisitors}
                                visitorType={historyPage.visitorType}
                                totalVisitors={historyPage.sortedVisitors.length}
                                startDate={historyPage.effectiveStartDate}
                                endDate={historyPage.effectiveEndDate}
                                requiredVisits={requiredVisits}
                                currentPage={historyPage.currentPage}
                                totalPages={historyPage.totalPages}
                                rowsPerPage={historyPage.rowsPerPage}
                                activeVisitorCount={
                                    historyPage.visitorType === 'student'
                                        ? historyPage.rangeMetrics.activeStudentVisitors
                                        : historyPage.rangeMetrics.activeEmployeeVisitors
                                }
                                search={historyPage.search}
                                logStatus={historyPage.logStatus}
                                sortColumn={historyPage.sortColumn}
                                sortDirection={historyPage.sortDirection}
                                selectedVisitorId={highlightedVisitorId}
                                filterPanel={
                                    <VisitHistoryFilterPanel
                                        filters={visitHistory.filters}
                                        schoolYearName={visitHistory.schoolYear?.name}
                                        schoolYearStart={historyPage.schoolYearStart}
                                        schoolYearEnd={historyPage.schoolYearEnd}
                                        startDate={historyPage.startDate}
                                        endDate={historyPage.endDate}
                                        visitorType={historyPage.visitorType}
                                        yearLevel={historyPage.yearLevel}
                                        section={historyPage.section}
                                        department={historyPage.department}
                                        search={historyPage.search}
                                        logStatus={historyPage.logStatus}
                                        sortColumn={historyPage.sortColumn}
                                        sortDirection={historyPage.sortDirection}
                                        onStartDateChange={historyPage.setStartDate}
                                        onEndDateChange={historyPage.setEndDate}
                                        onResetDateCoverage={historyPage.resetDateCoverage}
                                        onYearLevelChange={historyPage.changeYearLevel}
                                        onSectionChange={historyPage.setSection}
                                        onDepartmentChange={historyPage.setDepartment}
                                        onSearchChange={historyPage.setSearch}
                                        onLogStatusChange={historyPage.setLogStatus}
                                        onQuickSortChange={historyPage.changeQuickSort}
                                        onClearFilters={historyPage.clearFilters}
                                        showVisitStatusFilter
                                        showTableControls={false}
                                        framed={false}
                                    />
                                }
                                onSortChange={historyPage.changeSort}
                                onSearchChange={historyPage.setSearch}
                                onLogStatusChange={historyPage.setLogStatus}
                                onQuickSortChange={historyPage.changeQuickSort}
                                onRowsPerPageChange={historyPage.setRowsPerPage}
                                onPrevious={historyPage.previousPage}
                                onNext={historyPage.nextPage}
                                onPageChange={historyPage.changePage}
                                onVisitorOpen={(visitor) => {
                                    setHighlightedVisitorId(visitor.id);
                                    window.setTimeout(() => setHighlightedVisitorId((current) => (current === visitor.id ? null : current)), 3500);
                                    historyPage.setSelectedVisitor(visitor);
                                }}
                            />
                        </section>

                        <VisitHistoryInsights
                            visitors={historyPage.sortedVisitors}
                            visitorType={historyPage.visitorType}
                            onStudentGroupSelect={(yearLevel, section) => {
                                historyPage.changeYearLevel(yearLevel);
                                historyPage.setSection(section);
                            }}
                            onDepartmentSelect={historyPage.setDepartment}
                        />
                    </div>

                    <VisitorHistoryModal
                        visitor={historyPage.selectedVisitor}
                        visits={historyPage.selectedVisitorVisits}
                        startDate={historyPage.effectiveStartDate}
                        endDate={historyPage.effectiveEndDate}
                        open={Boolean(historyPage.selectedVisitor)}
                        onOpenChange={(open) => {
                            if (!open) {
                                historyPage.setSelectedVisitor(null);
                            }
                        }}
                    />
                </AdminLayout>
            </main>
        </>
    );
}
