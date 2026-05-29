import { VisitProgressDrilldownModal, type VisitProgressDrilldown } from '@/components/admin/visit-progress/visit-progress-drilldown-modal';
import type { ProgressStatusFilter } from '@/components/admin/visit-progress/visit-progress-helpers';
import { VisitProgressOverview } from '@/components/admin/visit-progress/visit-progress-overview';
import { VisitProgressRanking } from '@/components/admin/visit-progress/visit-progress-ranking';
import { PageExportActions } from '@/components/admin/exports/page-export-actions';
import { useVisitsHistoryPage } from '@/components/admin/visits-history/use-visits-history-page';
import { VisitHistoryFilterPanel } from '@/components/admin/visits-history/visit-history-filter-panel';
import type { VisitorTypeFilter, VisitorWithRangeVisits } from '@/components/admin/visits-history/visit-history-helpers';
import { VisitorHistoryModal } from '@/components/admin/visits-history/visitor-history-modal';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitHistory } from '@/types/dashboard';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface VisitProgressProps {
    visitHistory: AdminVisitHistory;
    initialVisitorType: VisitorTypeFilter;
}

export default function VisitProgress({ visitHistory, initialVisitorType }: VisitProgressProps) {
    const page = useVisitsHistoryPage(visitHistory, initialVisitorType);
    const [drilldown, setDrilldown] = useState<VisitProgressDrilldown | null>(null);
    const [progressStatus, setProgressStatus] = useState<ProgressStatusFilter>('all');
    const audienceLabel = page.visitorType === 'student' ? 'Student' : 'Employee';
    const requiredVisits =
        page.visitorType === 'student' ? (visitHistory.schoolYear?.student_required_visits ?? 0) : (visitHistory.schoolYear?.employee_required_visits ?? 0);
    const openVisitor = (visitor: VisitorWithRangeVisits) => {
        page.setSelectedVisitor(visitor);
    };

    return (
        <>
            <Head title={`${audienceLabel} Visit Progress`} />
            <main className="min-h-screen">
                <AdminLayout active="visit-progress">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title={`${audienceLabel} Visit Progress`}
                            description={`Track required-visit completion for ${audienceLabel.toLowerCase()}s in the active school year.`}
                            badge={
                                <span className="rounded-full border border-[#040DBF]/10 bg-white px-3 py-1 text-sm font-semibold text-[#030A8C] shadow-sm">
                                    {requiredVisits} required visits
                                </span>
                            }
                            actions={
                                <PageExportActions
                                    page="visit-progress"
                                    audience={page.visitorType === 'student' ? 'students' : 'employees'}
                                    query={{
                                        school_year_id: visitHistory.schoolYear?.id,
                                        start_date: page.effectiveStartDate,
                                        end_date: page.effectiveEndDate,
                                        year_level: page.yearLevel,
                                        section: page.section,
                                        department: page.department,
                                        search: page.search,
                                        status: progressStatus,
                                        sort: page.sortColumn,
                                        direction: page.sortDirection,
                                    }}
                                />
                            }
                        />

                        <VisitProgressRanking
                            visitors={page.progressVisitors}
                            visitorType={page.visitorType}
                            requiredVisits={requiredVisits}
                            search={page.search}
                            statusFilter={progressStatus}
                            sortColumn={page.sortColumn}
                            sortDirection={page.sortDirection}
                            filterPanel={
                                <VisitHistoryFilterPanel
                                    filters={visitHistory.filters}
                                    schoolYearName={visitHistory.schoolYear?.name}
                                    schoolYearStart={page.schoolYearStart}
                                    schoolYearEnd={page.schoolYearEnd}
                                    startDate={page.startDate}
                                    endDate={page.endDate}
                                    visitorType={page.visitorType}
                                    yearLevel={page.yearLevel}
                                    section={page.section}
                                    department={page.department}
                                    search={page.search}
                                    sortColumn={page.sortColumn}
                                    sortDirection={page.sortDirection}
                                    onStartDateChange={page.setStartDate}
                                    onEndDateChange={page.setEndDate}
                                    onResetDateCoverage={page.resetDateCoverage}
                                    onYearLevelChange={page.changeYearLevel}
                                    onSectionChange={page.setSection}
                                    onDepartmentChange={page.setDepartment}
                                    onSearchChange={page.setSearch}
                                    onQuickSortChange={page.changeQuickSort}
                                    onClearFilters={page.clearFilters}
                                    showTableControls={false}
                                    framed={false}
                                />
                            }
                            onSearchChange={page.setSearch}
                            onStatusFilterChange={setProgressStatus}
                            onQuickSortChange={page.changeQuickSort}
                            onVisitorOpen={openVisitor}
                        />

                        <VisitProgressOverview
                            visitors={page.progressVisitors}
                            visitorType={page.visitorType}
                            requiredVisits={requiredVisits}
                            onDrilldownOpen={setDrilldown}
                        />
                    </div>

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
                    <VisitProgressDrilldownModal
                        drilldown={drilldown}
                        visitorType={page.visitorType}
                        requiredVisits={requiredVisits}
                        onOpenChange={(open) => {
                            if (!open) {
                                setDrilldown(null);
                            }
                        }}
                        onVisitorOpen={openVisitor}
                    />
                </AdminLayout>
            </main>
        </>
    );
}
