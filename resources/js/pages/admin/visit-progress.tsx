import { VisitProgressOverview } from '@/components/admin/visit-progress/visit-progress-overview';
import { useVisitsHistoryPage } from '@/components/admin/visits-history/use-visits-history-page';
import { VisitHistoryWatchlistPanel } from '@/components/admin/visits-history/visit-history-breakdown';
import { VisitHistoryDateRangeCard } from '@/components/admin/visits-history/visit-history-date-range-card';
import { VisitHistoryFilterBar } from '@/components/admin/visits-history/visit-history-filter-bar';
import type { VisitorTypeFilter } from '@/components/admin/visits-history/visit-history-helpers';
import { VisitHistoryProgressPanel } from '@/components/admin/visits-history/visit-history-progress-panel';
import { VisitorHistoryModal } from '@/components/admin/visits-history/visitor-history-modal';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitHistory } from '@/types/dashboard';
import { Head } from '@inertiajs/react';
import { BarChart3, ListChecks, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface VisitProgressProps {
    visitHistory: AdminVisitHistory;
    initialVisitorType: VisitorTypeFilter;
}

type ProgressView = 'watchlist' | 'progress';

const viewItems: Array<{ value: ProgressView; label: string; detail: string; icon: LucideIcon }> = [
    {
        value: 'watchlist',
        label: 'Watchlist',
        detail: 'No visits, low progress, and weak groups',
        icon: ListChecks,
    },
    {
        value: 'progress',
        label: 'Progress',
        detail: 'Individual completion and required visits',
        icon: BarChart3,
    },
];

export default function VisitProgress({ visitHistory, initialVisitorType }: VisitProgressProps) {
    const page = useVisitsHistoryPage(visitHistory, initialVisitorType);
    const [activeView, setActiveView] = useState<ProgressView>('watchlist');
    const audienceLabel = page.visitorType === 'student' ? 'Student' : 'Employee';

    const selectSection = (yearLevel: string, section: string) => {
        page.changeYearLevel(yearLevel);
        page.setSection(section);
    };

    return (
        <>
            <Head title={`${audienceLabel} Visit Progress`} />
            <main className="min-h-screen">
                <AdminLayout active="visit-progress">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title={`${audienceLabel} Visit Progress`}
                            description={`Monitor ${audienceLabel.toLowerCase()} completion, no-visit groups, and follow-up priorities for the active school year.`}
                        />

                        <VisitHistoryDateRangeCard
                            schoolYearName={visitHistory.schoolYear?.name}
                            schoolYearStart={page.schoolYearStart}
                            schoolYearEnd={page.schoolYearEnd}
                            startDate={page.startDate}
                            endDate={page.endDate}
                            onStartDateChange={page.setStartDate}
                            onEndDateChange={page.setEndDate}
                            onReset={page.resetDateCoverage}
                        />

                        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
                            <VisitHistoryFilterBar
                                filters={visitHistory.filters}
                                metrics={visitHistory.metrics}
                                visitorType={page.visitorType}
                                yearLevel={page.yearLevel}
                                section={page.section}
                                department={page.department}
                                search={page.search}
                                sortColumn={page.sortColumn}
                                sortDirection={page.sortDirection}
                                onVisitorTypeChange={page.changeVisitorType}
                                onYearLevelChange={page.changeYearLevel}
                                onSectionChange={page.setSection}
                                onDepartmentChange={page.setDepartment}
                                onSearchChange={page.setSearch}
                                onQuickSortChange={page.changeQuickSort}
                                showVisitorType={false}
                            />
                        </section>

                        <VisitProgressOverview
                            visitors={page.progressVisitors}
                            visitorType={page.visitorType}
                            studentRequiredVisits={visitHistory.schoolYear?.student_required_visits ?? 0}
                            employeeRequiredVisits={visitHistory.schoolYear?.employee_required_visits ?? 0}
                            onYearLevelSelect={page.changeYearLevel}
                            onSectionSelect={selectSection}
                            onDepartmentSelect={page.setDepartment}
                        />

                        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-4 shadow-sm">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-[#010440]">Detailed progress views</h2>
                                    <p className="mt-1 text-sm text-[#020659]/70">Switch between follow-up groups and individual completion.</p>
                                </div>
                                <span className="rounded-full bg-[#040DBF]/10 px-3 py-1.5 text-xs font-semibold text-[#030A8C]">
                                    {audienceLabel}s
                                </span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {viewItems.map((item) => (
                                    <ProgressViewButton
                                        key={item.value}
                                        active={activeView === item.value}
                                        icon={item.icon}
                                        label={item.label}
                                        detail={item.detail}
                                        onClick={() => setActiveView(item.value)}
                                    />
                                ))}
                            </div>
                        </section>

                        <div key={`${activeView}-${page.visitorType}`} className="visit-history-view-panel page-lift">
                            {activeView === 'watchlist' ? (
                                <VisitHistoryWatchlistPanel
                                    visitors={page.progressVisitors}
                                    studentRequiredVisits={visitHistory.schoolYear?.student_required_visits ?? 0}
                                    employeeRequiredVisits={visitHistory.schoolYear?.employee_required_visits ?? 0}
                                    activeType={page.visitorType}
                                    onActiveTypeChange={page.changeVisitorType}
                                />
                            ) : (
                                <VisitHistoryProgressPanel
                                    visitors={page.progressVisitors}
                                    visitorType={page.visitorType}
                                    studentRequiredVisits={visitHistory.schoolYear?.student_required_visits ?? 0}
                                    employeeRequiredVisits={visitHistory.schoolYear?.employee_required_visits ?? 0}
                                    onVisitorOpen={page.setSelectedVisitor}
                                />
                            )}
                        </div>
                    </div>

                    <VisitorHistoryModal
                        visitor={page.selectedVisitor}
                        visits={page.selectedVisitorVisits}
                        startDate={page.startDate}
                        endDate={page.endDate}
                        open={Boolean(page.selectedVisitor)}
                        onOpenChange={(open) => {
                            if (!open) {
                                page.setSelectedVisitor(null);
                            }
                        }}
                    />
                </AdminLayout>
            </main>
        </>
    );
}

function ProgressViewButton({
    active,
    icon: Icon,
    label,
    detail,
    onClick,
}: {
    active: boolean;
    icon: LucideIcon;
    label: string;
    detail: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`grid min-h-20 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 rounded-lg border p-3 text-left transition-[background-color,border-color,color,box-shadow,transform] hover:-translate-y-0.5 ${
                active
                    ? 'border-[#040DBF] bg-[#040DBF] text-white shadow-md shadow-[#040DBF]/20'
                    : 'border-[#040DBF]/10 bg-[#f6f8ff] text-[#010440] hover:border-[#040DBF]/25 hover:bg-white hover:shadow-sm'
            }`}
        >
            <span
                className={`inline-flex size-10 items-center justify-center rounded-lg ${
                    active ? 'bg-white/15 text-white' : 'admin-icon-badge bg-[#040DBF]/10 text-[#040DBF]'
                }`}
            >
                <Icon className="size-5" />
            </span>
            <span className="min-w-0">
                <span className="block font-semibold">{label}</span>
                <span className={`mt-1 block text-sm leading-5 ${active ? 'text-white/75' : 'text-[#020659]/70'}`}>{detail}</span>
            </span>
        </button>
    );
}
