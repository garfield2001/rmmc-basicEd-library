import { useVisitsHistoryPage } from '@/components/admin/visits-history/use-visits-history-page';
import { VisitHistoryDateRangeCard } from '@/components/admin/visits-history/visit-history-date-range-card';
import { VisitHistoryFilterBar } from '@/components/admin/visits-history/visit-history-filter-bar';
import type { VisitorTypeFilter } from '@/components/admin/visits-history/visit-history-helpers';
import { VisitHistoryMetrics } from '@/components/admin/visits-history/visit-history-metrics';
import { VisitHistoryTable } from '@/components/admin/visits-history/visit-history-table';
import { VisitorHistoryModal } from '@/components/admin/visits-history/visitor-history-modal';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitHistory } from '@/types/dashboard';
import { Head } from '@inertiajs/react';

interface VisitsHistoryProps {
    visitHistory: AdminVisitHistory;
    initialVisitorType: VisitorTypeFilter;
}

export default function VisitsHistory({ visitHistory, initialVisitorType }: VisitsHistoryProps) {
    const historyPage = useVisitsHistoryPage(visitHistory, initialVisitorType);
    const audienceLabel = historyPage.visitorType === 'student' ? 'Student' : 'Employee';

    return (
        <>
            <Head title={`${audienceLabel} Visit Logs`} />
            <main className="min-h-screen">
                <AdminLayout active="visits-history">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title={`${audienceLabel} Visit Logs`}
                            description={`Audit exact ${audienceLabel.toLowerCase()} visit records, timestamps, and date coverage for the active school year.`}
                        />

                        <VisitHistoryMetrics
                            metrics={visitHistory.metrics}
                            rangeMetrics={historyPage.rangeMetrics}
                            visitorType={historyPage.visitorType}
                        />

                        <VisitHistoryDateRangeCard
                            schoolYearName={visitHistory.schoolYear?.name}
                            schoolYearStart={historyPage.schoolYearStart}
                            schoolYearEnd={historyPage.schoolYearEnd}
                            startDate={historyPage.startDate}
                            endDate={historyPage.endDate}
                            onStartDateChange={historyPage.setStartDate}
                            onEndDateChange={historyPage.setEndDate}
                            onReset={historyPage.resetDateCoverage}
                        />

                        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
                            <VisitHistoryFilterBar
                                filters={visitHistory.filters}
                                metrics={visitHistory.metrics}
                                visitorType={historyPage.visitorType}
                                yearLevel={historyPage.yearLevel}
                                section={historyPage.section}
                                department={historyPage.department}
                                search={historyPage.search}
                                sortColumn={historyPage.sortColumn}
                                sortDirection={historyPage.sortDirection}
                                onVisitorTypeChange={historyPage.changeVisitorType}
                                onYearLevelChange={historyPage.changeYearLevel}
                                onSectionChange={historyPage.setSection}
                                onDepartmentChange={historyPage.setDepartment}
                                onSearchChange={historyPage.setSearch}
                                onQuickSortChange={historyPage.changeQuickSort}
                                showVisitorType={false}
                            />
                            <VisitHistoryTable
                                visitors={historyPage.visibleVisitors}
                                totalVisitors={historyPage.sortedVisitors.length}
                                startDate={historyPage.startDate}
                                endDate={historyPage.endDate}
                                currentPage={historyPage.currentPage}
                                totalPages={historyPage.totalPages}
                                rowsPerPage={historyPage.rowsPerPage}
                                sortColumn={historyPage.sortColumn}
                                sortDirection={historyPage.sortDirection}
                                onSortChange={historyPage.changeSort}
                                onRowsPerPageChange={historyPage.setRowsPerPage}
                                onPrevious={historyPage.previousPage}
                                onNext={historyPage.nextPage}
                                onPageChange={historyPage.changePage}
                                onVisitorOpen={historyPage.setSelectedVisitor}
                            />
                        </section>
                    </div>

                    <VisitorHistoryModal
                        visitor={historyPage.selectedVisitor}
                        visits={historyPage.selectedVisitorVisits}
                        startDate={historyPage.startDate}
                        endDate={historyPage.endDate}
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
