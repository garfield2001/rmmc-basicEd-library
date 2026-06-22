import { PageExportActions } from '@/components/admin/exports/page-export-actions';
import { useVisitLogsPage } from '@/components/admin/visit-logs/use-visit-logs-page';
import { VisitLogsFilterPanel } from '@/components/admin/visit-logs/visit-logs-filter-panel';
import type { VisitorTypeFilter, VisitorWithRangeVisits } from '@/components/admin/visit-logs/visit-logs-helpers';
import { VisitorHistoryModal } from '@/components/admin/visit-logs/visitor-history-modal';
import { VisitProgressDrilldownModal, type VisitProgressDrilldown } from '@/components/admin/visit-progress/visit-progress-drilldown-modal';
import { VisitProgressOverview } from '@/components/admin/visit-progress/visit-progress-overview';
import { VisitProgressRanking } from '@/components/admin/visit-progress/visit-progress-ranking';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitLogs } from '@/types/dashboard';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface VisitProgressProps {
    visitLogs: AdminVisitLogs;
    initialVisitorType: VisitorTypeFilter;
}

export default function VisitProgress({ visitLogs, initialVisitorType }: VisitProgressProps) {
    const page = useVisitLogsPage(visitLogs, initialVisitorType);
    const [drilldown, setDrilldown] = useState<VisitProgressDrilldown | null>(null);
    const audienceLabel = page.visitorType === 'student' ? 'Student' : 'Employee';
    const requiredVisits =
        page.visitorType === 'student' ? (visitLogs.schoolYear?.student_required_visits ?? 0) : (visitLogs.schoolYear?.employee_required_visits ?? 0);
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
                                <span className="admin-required-visits-badge rounded-full px-3 py-1 text-sm font-semibold">
                                    {requiredVisits} required visits
                                </span>
                            }
                            actions={
                                <PageExportActions
                                    page="visit-progress"
                                    audience={page.visitorType === 'student' ? 'students' : 'employees'}
                                    query={{
                                        school_year_id: visitLogs.schoolYear?.id,
                                        start_date: page.effectiveStartDate,
                                        end_date: page.effectiveEndDate,
                                        year_level: page.yearLevel,
                                        section: page.section,
                                        department: page.department,
                                        search: page.search,
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
                            sortColumn={page.sortColumn}
                            sortDirection={page.sortDirection}
                            filters={visitLogs.filters}
                            yearLevel={page.yearLevel}
                            section={page.section}
                            department={page.department}
                            onYearLevelChange={page.changeYearLevel}
                            onSectionChange={page.setSection}
                            onDepartmentChange={page.setDepartment}
                            filterPanel={
                                <VisitLogsFilterPanel
                                    schoolYearName={visitLogs.schoolYear?.name}
                                    schoolYearStart={page.schoolYearStart}
                                    schoolYearEnd={page.schoolYearEnd}
                                    startDate={page.startDate}
                                    endDate={page.endDate}
                                    onStartDateChange={page.setStartDate}
                                    onEndDateChange={page.setEndDate}
                                    onResetDateCoverage={page.resetDateCoverage}
                                    onClearFilters={page.clearFilters}
                                    framed={false}
                                />
                            }
                            onSearchChange={page.setSearch}
                            onSortChange={page.changeSort}
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
