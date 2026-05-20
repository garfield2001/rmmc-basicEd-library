import { useVisitsHistoryPage } from '@/components/admin/visits-history/use-visits-history-page';
import { VisitHistoryDateRangeCard } from '@/components/admin/visits-history/visit-history-date-range-card';
import { VisitHistoryFilterBar } from '@/components/admin/visits-history/visit-history-filter-bar';
import { VisitHistoryMetrics } from '@/components/admin/visits-history/visit-history-metrics';
import { VisitHistoryTable } from '@/components/admin/visits-history/visit-history-table';
import { VisitorHistoryModal } from '@/components/admin/visits-history/visitor-history-modal';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitHistory } from '@/types/dashboard';
import { Head } from '@inertiajs/react';

interface VisitsHistoryProps {
    visitHistory: AdminVisitHistory;
}

export default function VisitsHistory({ visitHistory }: VisitsHistoryProps) {
    const historyPage = useVisitsHistoryPage(visitHistory);

    return (
        <>
            <Head title="Visits History" />
            <main className="min-h-screen">
                <AdminLayout active="visits-history">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Visits History"
                            description="Find a visitor in the active school year, then open their complete visit log for the selected dates."
                        />

                        <VisitHistoryMetrics metrics={visitHistory.metrics} rangeMetrics={historyPage.rangeMetrics} />

                        <VisitHistoryDateRangeCard
                            schoolYearName={visitHistory.schoolYear?.name}
                            schoolYearStart={historyPage.schoolYearStart}
                            schoolYearEnd={historyPage.schoolYearEnd}
                            startDate={historyPage.startDate}
                            onStartDateChange={historyPage.setStartDate}
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
                                onVisitorTypeChange={historyPage.changeVisitorType}
                                onYearLevelChange={historyPage.changeYearLevel}
                                onSectionChange={historyPage.setSection}
                                onDepartmentChange={historyPage.setDepartment}
                                onSearchChange={historyPage.setSearch}
                            />
                            <VisitHistoryTable
                                visitors={historyPage.visibleVisitors}
                                totalVisitors={historyPage.sortedVisitors.length}
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
                        endDate=""
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
