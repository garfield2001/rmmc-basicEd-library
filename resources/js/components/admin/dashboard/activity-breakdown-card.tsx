import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { HorizontalBarChart } from '@/components/admin/dashboard/horizontal-bar-chart';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { AdminDashboard } from '@/types/dashboard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ShowAllButton } from './activity-breakdown-controls';
import {
    activityDefaultLimit,
    activityPanelDetails,
    activityPanelOrder,
    filterEmployeeActivityVisits,
    filterStudentActivityVisits,
    groupEmployeeActivity,
    groupStudentActivity,
    type ActivityPanel,
} from './activity-breakdown-helpers';

export function ActivityBreakdownCard({ dashboard }: { dashboard: AdminDashboard }) {
    const [activeActivity, setActiveActivity] = useState<ActivityPanel>('yearLevel');
    const [showAllActivity, setShowAllActivity] = useState(false);
    const studentActivityVisits = useMemo(
        () => filterStudentActivityVisits(dashboard.charts.studentActivityVisits, dashboard.schoolYear?.starts_at ?? '', dashboard.schoolYear?.ends_at ?? ''),
        [dashboard.charts.studentActivityVisits, dashboard.schoolYear?.ends_at, dashboard.schoolYear?.starts_at],
    );
    const departmentActivityVisits = useMemo(
        () => filterEmployeeActivityVisits(dashboard.charts.employeeActivityVisits, dashboard.schoolYear?.starts_at ?? '', dashboard.schoolYear?.ends_at ?? ''),
        [dashboard.charts.employeeActivityVisits, dashboard.schoolYear?.ends_at, dashboard.schoolYear?.starts_at],
    );
    const allYearLevelData = useMemo(
        () => groupStudentActivity(studentActivityVisits, 'yearLevel', dashboard.charts.activityGroups.yearLevels),
        [dashboard.charts.activityGroups.yearLevels, studentActivityVisits],
    );
    const allSectionData = useMemo(
        () => groupStudentActivity(studentActivityVisits, 'section', dashboard.charts.activityGroups.sections),
        [dashboard.charts.activityGroups.sections, studentActivityVisits],
    );
    const allDepartmentData = useMemo(
        () => groupEmployeeActivity(departmentActivityVisits, dashboard.charts.activityGroups.departments),
        [dashboard.charts.activityGroups.departments, departmentActivityVisits],
    );
    const activityPanel = activityPanelDetails[activeActivity];
    const isNarrowScreen = useMediaQuery('(max-width: 640px)');
    const activityLabelWidth = isNarrowScreen ? Math.min(activityPanel.labelWidth, 118) : activityPanel.labelWidth;
    const allActivityData = activeActivity === 'yearLevel' ? allYearLevelData : activeActivity === 'section' ? allSectionData : allDepartmentData;
    const activityData = showAllActivity ? allActivityData : allActivityData.slice(0, activityDefaultLimit);
    const chartHeight = showAllActivity ? Math.max(320, activityData.length * (isNarrowScreen ? 38 : 44) + 48) : 320;
    const activeIndex = activityPanelOrder.indexOf(activeActivity);
    const previousPanel = activityPanelOrder[(activeIndex - 1 + activityPanelOrder.length) % activityPanelOrder.length];
    const nextPanel = activityPanelOrder[(activeIndex + 1) % activityPanelOrder.length];
    const changePanel = (panel: ActivityPanel) => {
        setActiveActivity(panel);
        setShowAllActivity(false);
    };

    return (
        <ChartCard
            title="Activity Breakdown"
            detail={`Active school-year visits by ${activityPanel.detail}`}
            icon={activityPanel.icon}
        >
            <div className="group/activity relative">
                <CarouselButton direction="left" label="Previous activity breakdown" onClick={() => changePanel(previousPanel)} />
                <CarouselButton direction="right" label="Next activity breakdown" onClick={() => changePanel(nextPanel)} />
                <div className="mb-3 grid items-center gap-2" style={{ gridTemplateColumns: `${activityLabelWidth}px minmax(0, 1fr)` }}>
                    <p className="text-sm font-medium text-[#020659]/70">{activityPanel.title}</p>
                    <div className="justify-self-end">
                        <ShowAllButton total={allActivityData.length} expanded={showAllActivity} onClick={() => setShowAllActivity((value) => !value)} />
                    </div>
                </div>
                <div>
                    <HorizontalBarChart data={activityData} emptyMessage={activityPanel.emptyMessage} labelWidth={activityLabelWidth} height={chartHeight} />
                </div>
            </div>
        </ChartCard>
    );
}

function CarouselButton({ direction, label, onClick }: { direction: 'left' | 'right'; label: string; onClick: () => void }) {
    const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#020659] opacity-20 shadow-md ring-1 ring-[#040DBF]/10 backdrop-blur transition duration-200 hover:scale-110 hover:bg-[#040DBF] hover:text-white hover:opacity-100 group-hover/activity:opacity-100 ${
                direction === 'left' ? '-left-3 hover:-translate-x-0.5' : '-right-3 hover:translate-x-0.5'
            }`}
        >
            <Icon className="size-5" />
        </button>
    );
}
