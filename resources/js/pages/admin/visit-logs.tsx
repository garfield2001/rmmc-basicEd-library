import { useVisitLogsPage } from '@/components/admin/visit-logs/use-visit-logs-page';
import { PageExportActions } from '@/components/admin/exports/page-export-actions';
import { VisitLogsFilterPanel } from '@/components/admin/visit-logs/visit-logs-filter-panel';
import { VisitLogsInsights } from '@/components/admin/visit-logs/visit-logs-insights';
import type { VisitorTypeFilter } from '@/components/admin/visit-logs/visit-logs-helpers';
import { VisitLogsTable } from '@/components/admin/visit-logs/visit-logs-table';
import { VisitorHistoryModal } from '@/components/admin/visit-logs/visitor-history-modal';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitLogs } from '@/types/dashboard';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface VisitLogsProps {
    visitLogs: AdminVisitLogs;
    initialVisitorType: VisitorTypeFilter;
}

export default function VisitLogs({ visitLogs, initialVisitorType }: VisitLogsProps) {
    const logsPage = useVisitLogsPage(visitLogs, initialVisitorType);
    const [highlightedVisitorId, setHighlightedVisitorId] = useState<number | null>(null);
    const audienceLabel = logsPage.visitorType === 'student' ? 'Student' : 'Employee';
    const visitorCount = logsPage.visitorType === 'student' ? visitLogs.metrics.studentVisitors : visitLogs.metrics.employeeVisitors;
    const requiredVisits =
        logsPage.visitorType === 'student'
            ? (visitLogs.schoolYear?.student_required_visits ?? 0)
            : (visitLogs.schoolYear?.employee_required_visits ?? 0);

    return (
        <>
            <Head title={`${audienceLabel} Visit Logs`} />
            <main className="min-h-screen">
                <AdminLayout active="visit-logs">
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
                                    audience={logsPage.visitorType === 'student' ? 'students' : 'employees'}
                                    query={{
                                        school_year_id: visitLogs.schoolYear?.id,
                                        start_date: logsPage.effectiveStartDate,
                                        end_date: logsPage.effectiveEndDate,
                                        year_level: logsPage.yearLevel,
                                        section: logsPage.section,
                                        department: logsPage.department,
                                        search: logsPage.search,
                                        status: logsPage.logStatus,
                                        sort: logsPage.sortColumn,
                                        direction: logsPage.sortDirection,
                                    }}
                                />
                            }
                        />

                        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
                            <VisitLogsTable
                                visitors={logsPage.visibleVisitors}
                                visitorType={logsPage.visitorType}
                                totalVisitors={logsPage.sortedVisitors.length}
                                startDate={logsPage.effectiveStartDate}
                                endDate={logsPage.effectiveEndDate}
                                requiredVisits={requiredVisits}
                                currentPage={logsPage.currentPage}
                                totalPages={logsPage.totalPages}
                                rowsPerPage={logsPage.rowsPerPage}
                                activeVisitorCount={
                                    logsPage.visitorType === 'student'
                                        ? logsPage.rangeMetrics.activeStudentVisitors
                                        : logsPage.rangeMetrics.activeEmployeeVisitors
                                }
                                search={logsPage.search}
                                sortColumn={logsPage.sortColumn}
                                sortDirection={logsPage.sortDirection}
                                selectedVisitorId={highlightedVisitorId}
                                filters={visitLogs.filters}
                                yearLevel={logsPage.yearLevel}
                                section={logsPage.section}
                                department={logsPage.department}
                                onYearLevelChange={logsPage.changeYearLevel}
                                onSectionChange={logsPage.setSection}
                                onDepartmentChange={logsPage.setDepartment}
                                filterPanel={
                                    <VisitLogsFilterPanel
                                        schoolYearName={visitLogs.schoolYear?.name}
                                        schoolYearStart={logsPage.schoolYearStart}
                                        schoolYearEnd={logsPage.schoolYearEnd}
                                        startDate={logsPage.startDate}
                                        endDate={logsPage.endDate}
                                        onStartDateChange={logsPage.setStartDate}
                                        onEndDateChange={logsPage.setEndDate}
                                        onResetDateCoverage={logsPage.resetDateCoverage}
                                        onClearFilters={logsPage.clearFilters}
                                        framed={false}
                                    />
                                }
                                onSortChange={logsPage.changeSort}
                                onSearchChange={logsPage.setSearch}
                                onRowsPerPageChange={logsPage.setRowsPerPage}
                                onPrevious={logsPage.previousPage}
                                onNext={logsPage.nextPage}
                                onPageChange={logsPage.changePage}
                                onVisitorOpen={(visitor) => {
                                    setHighlightedVisitorId(visitor.id);
                                    window.setTimeout(() => setHighlightedVisitorId((current) => (current === visitor.id ? null : current)), 3500);
                                    logsPage.setSelectedVisitor(visitor);
                                }}
                            />
                        </section>

                        <VisitLogsInsights
                            visitors={logsPage.sortedVisitors}
                            visitorType={logsPage.visitorType}
                            onStudentGroupSelect={(yearLevel, section) => {
                                logsPage.changeYearLevel(yearLevel);
                                logsPage.setSection(section);
                            }}
                            onDepartmentSelect={logsPage.setDepartment}
                        />
                    </div>

                    <VisitorHistoryModal
                        visitor={logsPage.selectedVisitor}
                        visits={logsPage.selectedVisitorVisits}
                        startDate={logsPage.effectiveStartDate}
                        endDate={logsPage.effectiveEndDate}
                        open={Boolean(logsPage.selectedVisitor)}
                        onOpenChange={(open) => {
                            if (!open) {
                                logsPage.setSelectedVisitor(null);
                            }
                        }}
                    />
                </AdminLayout>
            </main>
        </>
    );
}
