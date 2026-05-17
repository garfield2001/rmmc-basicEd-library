import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { HorizontalBarChart } from '@/components/admin/dashboard/horizontal-bar-chart';
import { RangeControls, rangeDetail, relativeDateRange } from '@/components/admin/dashboard/range-controls';
import type { AdminDashboard, ChartPoint, EmployeeActivityVisit, StudentActivityVisit, VisitTrafficRange } from '@/types/dashboard';
import { BriefcaseBusiness, ChevronLeft, ChevronRight, GraduationCap, Target, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

type ActivityPanel = 'yearLevel' | 'section' | 'department';

const activityPanelOrder: ActivityPanel[] = ['yearLevel', 'section', 'department'];

const activityPanelDetails = {
    yearLevel: {
        title: 'Year Level Activity',
        detail: 'student year level',
        label: 'Year level',
        icon: GraduationCap,
        emptyMessage: 'Student visits by year level will appear after scanning.',
        labelWidth: 150,
    },
    section: {
        title: 'Section Activity',
        detail: 'section',
        label: 'Section',
        icon: Target,
        emptyMessage: 'Section-level visit trends will appear after scanning students.',
        labelWidth: 240,
    },
    department: {
        title: 'Department Activity',
        detail: 'employee department',
        label: 'Department',
        icon: BriefcaseBusiness,
        emptyMessage: 'Department-level visit trends will appear after scanning employees.',
        labelWidth: 280,
    },
} satisfies Record<ActivityPanel, { title: string; detail: string; label: string; icon: LucideIcon; emptyMessage: string; labelWidth: number }>;

export function ActivityBreakdownCard({ dashboard }: { dashboard: AdminDashboard }) {
    const [range, setRange] = useState<VisitTrafficRange>('last14');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeActivity, setActiveActivity] = useState<ActivityPanel>('yearLevel');
    const [showAllActivity, setShowAllActivity] = useState(false);
    const studentActivityVisits = useMemo(
        () => filterStudentActivityVisits(dashboard.charts.studentActivityVisits, range, startDate, endDate),
        [dashboard.charts.studentActivityVisits, endDate, range, startDate],
    );
    const departmentActivityVisits = useMemo(
        () => filterEmployeeActivityVisits(dashboard.charts.employeeActivityVisits, range, startDate, endDate),
        [dashboard.charts.employeeActivityVisits, endDate, range, startDate],
    );
    const allYearLevelData = useMemo(() => groupStudentActivity(studentActivityVisits, 'yearLevel'), [studentActivityVisits]);
    const allSectionData = useMemo(() => groupStudentActivity(studentActivityVisits, 'section'), [studentActivityVisits]);
    const allDepartmentData = useMemo(() => groupEmployeeActivity(departmentActivityVisits), [departmentActivityVisits]);
    const activityPanel = activityPanelDetails[activeActivity];
    const allActivityData = activeActivity === 'yearLevel' ? allYearLevelData : activeActivity === 'section' ? allSectionData : allDepartmentData;
    const activityData = showAllActivity ? allActivityData : allActivityData.slice(0, 6);

    return (
        <ChartCard
            title="Activity Breakdown"
            detail={`${rangeDetail(range, startDate, endDate)} by ${activityPanel.detail}`}
            icon={activityPanel.icon}
            actions={
                <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <ActivityCarouselControls
                        active={activeActivity}
                        onChange={(panel) => {
                            setActiveActivity(panel);
                            setShowAllActivity(false);
                        }}
                    />
                    <RangeControls
                        value={range}
                        startDate={startDate}
                        endDate={endDate}
                        minDate={dashboard.schoolYear?.starts_at}
                        maxDate={dashboard.schoolYear?.ends_at}
                        onRangeChange={setRange}
                        className="xl:w-auto xl:justify-end"
                        onStartDateChange={(value) => {
                            setStartDate(value);
                            setRange('custom');
                        }}
                        onEndDateChange={(value) => {
                            setEndDate(value);
                            setRange('custom');
                        }}
                        onClearDates={() => {
                            setStartDate('');
                            setEndDate('');
                            setRange('last14');
                        }}
                    />
                </div>
            }
        >
            <div className="mb-3 grid items-center gap-2" style={{ gridTemplateColumns: `${activityPanel.labelWidth}px minmax(0, 1fr)` }}>
                <p className="text-sm font-medium text-[#020659]/70">{activityPanel.title}</p>
                <div className="justify-self-end pr-4">
                    <ShowAllButton total={allActivityData.length} expanded={showAllActivity} onClick={() => setShowAllActivity((value) => !value)} />
                </div>
            </div>
            <HorizontalBarChart data={activityData} emptyMessage={activityPanel.emptyMessage} labelWidth={activityPanel.labelWidth} />
        </ChartCard>
    );
}

function ActivityCarouselControls({ active, onChange }: { active: ActivityPanel; onChange: (panel: ActivityPanel) => void }) {
    const activeIndex = activityPanelOrder.indexOf(active);
    const previous = activityPanelOrder[(activeIndex - 1 + activityPanelOrder.length) % activityPanelOrder.length];
    const next = activityPanelOrder[(activeIndex + 1) % activityPanelOrder.length];

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={() => onChange(previous)}
                className="inline-flex size-10 items-center justify-center rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] text-[#020659] transition hover:border-[#040DBF]/25 hover:bg-white"
                aria-label={`Show ${activityPanelDetails[previous].title}`}
            >
                <ChevronLeft className="size-4" />
            </button>
            <div className="admin-segmented-tabs">
                {activityPanelOrder.map((panel) => (
                    <button
                        key={panel}
                        type="button"
                        onClick={() => onChange(panel)}
                        className={`admin-segmented-tab ${active === panel ? 'admin-segmented-tab-active' : ''}`}
                    >
                        {activityPanelDetails[panel].label}
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={() => onChange(next)}
                className="inline-flex size-10 items-center justify-center rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] text-[#020659] transition hover:border-[#040DBF]/25 hover:bg-white"
                aria-label={`Show ${activityPanelDetails[next].title}`}
            >
                <ChevronRight className="size-4" />
            </button>
        </div>
    );
}

function ShowAllButton({ total, expanded, onClick }: { total: number; expanded: boolean; onClick: () => void }) {
    if (total <= 6) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3 py-1.5 text-xs font-semibold text-[#020659] transition hover:border-[#040DBF]/25 hover:bg-white hover:text-[#010440]"
        >
            {expanded ? 'Show top 6 only' : `Show all ${total}`}
        </button>
    );
}

function filterStudentActivityVisits(visits: StudentActivityVisit[], range: VisitTrafficRange, startDate: string, endDate: string) {
    const [from, to] = range === 'custom' ? [startDate, endDate] : relativeDateRange(range);

    return visits.filter((visit) => visit.visitedAt && (!from || visit.visitedAt >= from) && (!to || visit.visitedAt <= to));
}

function filterEmployeeActivityVisits(visits: EmployeeActivityVisit[], range: VisitTrafficRange, startDate: string, endDate: string) {
    const [from, to] = range === 'custom' ? [startDate, endDate] : relativeDateRange(range);

    return visits.filter((visit) => visit.visitedAt && (!from || visit.visitedAt >= from) && (!to || visit.visitedAt <= to));
}

function groupStudentActivity(visits: StudentActivityVisit[], mode: 'yearLevel' | 'section'): ChartPoint[] {
    const groups = new Map<string, number>();

    visits.forEach((visit) => {
        const label =
            mode === 'yearLevel' ? visit.yearLevel || 'Unassigned' : [visit.yearLevel, visit.section].filter(Boolean).join(' - ') || 'Unassigned';

        groups.set(label, (groups.get(label) ?? 0) + 1);
    });

    return [...groups.entries()].map(([label, value]) => ({ label, value })).sort((first, second) => second.value - first.value);
}

function groupEmployeeActivity(visits: EmployeeActivityVisit[]): ChartPoint[] {
    const groups = new Map<string, number>();

    visits.forEach((visit) => {
        const label = visit.department || 'Unassigned';
        groups.set(label, (groups.get(label) ?? 0) + 1);
    });

    return [...groups.entries()].map(([label, value]) => ({ label, value })).sort((first, second) => second.value - first.value);
}
