import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { HorizontalBarChart } from '@/components/admin/dashboard/horizontal-bar-chart';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { AdminDashboard, VisitTrafficRange } from '@/types/dashboard';
import { useMemo, useState } from 'react';
import { ActivityBreakdownControls, ShowAllButton } from './activity-breakdown-controls';
import {
    activityRangeDetail,
    activityDefaultLimit,
    activityPanelDetails,
    filterEmployeeActivityVisits,
    filterStudentActivityVisits,
    groupEmployeeActivity,
    groupStudentActivity,
    type ActivityPanel,
} from './activity-breakdown-helpers';
import { RangeControls, relativeDateRange } from './range-controls';

export function ActivityBreakdownCard({ dashboard }: { dashboard: AdminDashboard }) {
    const [range, setRange] = useState<VisitTrafficRange>('last14');
    const [startDate, setStartDate] = useState(() => relativeDateRange('last14')[0]);
    const [endDate, setEndDate] = useState(() => relativeDateRange('last14')[1]);
    const [activeActivity, setActiveActivity] = useState<ActivityPanel>('yearLevel');
    const [showAllActivity, setShowAllActivity] = useState(false);
    const studentActivityVisits = useMemo(
        () => filterStudentActivityVisits(dashboard.charts.studentActivityVisits, startDate, endDate),
        [dashboard.charts.studentActivityVisits, endDate, startDate],
    );
    const departmentActivityVisits = useMemo(
        () => filterEmployeeActivityVisits(dashboard.charts.employeeActivityVisits, startDate, endDate),
        [dashboard.charts.employeeActivityVisits, endDate, startDate],
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

    return (
        <ChartCard
            title="Activity Breakdown"
            detail={`${activityRangeDetail(range, startDate, endDate)} by ${activityPanel.detail}`}
            icon={activityPanel.icon}
            actions={
                <div className="grid w-full gap-3 min-[1180px]:grid-cols-[max-content_minmax(0,1fr)] min-[1180px]:items-start">
                    <ActivityBreakdownControls
                        active={activeActivity}
                        onPanelChange={(panel) => {
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
                        compact
                        onRangeChange={(value) => {
                            setRange(value);

                            if (value !== 'custom') {
                                const [start, end] = relativeDateRange(value);
                                setStartDate(start);
                                setEndDate(end);
                            }
                        }}
                        onStartDateChange={(value) => {
                            setStartDate(value);
                            setEndDate(new Date().toISOString().slice(0, 10));
                            setRange('custom');
                        }}
                        onEndDateChange={(value) => {
                            setEndDate(value);
                            setRange('custom');
                        }}
                        onClearDates={() => {
                            const [start, end] = relativeDateRange('last14');
                            setStartDate(start);
                            setEndDate(end);
                            setRange('last14');
                        }}
                    />
                </div>
            }
        >
            <div className="mb-3 grid items-center gap-2" style={{ gridTemplateColumns: `${activityLabelWidth}px minmax(0, 1fr)` }}>
                <p className="text-sm font-medium text-[#020659]/70">{activityPanel.title}</p>
                <div className="justify-self-end pr-4">
                    <ShowAllButton total={allActivityData.length} expanded={showAllActivity} onClick={() => setShowAllActivity((value) => !value)} />
                </div>
            </div>
            <HorizontalBarChart data={activityData} emptyMessage={activityPanel.emptyMessage} labelWidth={activityLabelWidth} height={chartHeight} />
        </ChartCard>
    );
}
