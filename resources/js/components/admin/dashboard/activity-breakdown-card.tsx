import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { HorizontalBarChart } from '@/components/admin/dashboard/horizontal-bar-chart';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { AdminDashboard } from '@/types/dashboard';
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

export function ActivityBreakdownCard({ dashboard }: { dashboard: AdminDashboard }) {
    const [days, setDays] = useState(14);
    const [fromDate, setFromDate] = useState('');
    const [activeActivity, setActiveActivity] = useState<ActivityPanel>('yearLevel');
    const [showAllActivity, setShowAllActivity] = useState(false);
    const studentActivityVisits = useMemo(
        () => filterStudentActivityVisits(dashboard.charts.studentActivityVisits, days, fromDate),
        [dashboard.charts.studentActivityVisits, days, fromDate],
    );
    const departmentActivityVisits = useMemo(
        () => filterEmployeeActivityVisits(dashboard.charts.employeeActivityVisits, days, fromDate),
        [dashboard.charts.employeeActivityVisits, days, fromDate],
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
            detail={`${activityRangeDetail(days, fromDate)} by ${activityPanel.detail}`}
            icon={activityPanel.icon}
            actions={
                <ActivityBreakdownControls
                    active={activeActivity}
                    days={days}
                    fromDate={fromDate}
                    minDate={dashboard.schoolYear?.starts_at}
                    maxDate={new Date().toISOString().slice(0, 10)}
                    onPanelChange={(panel) => {
                        setActiveActivity(panel);
                        setShowAllActivity(false);
                    }}
                    onDaysChange={(value) => {
                        setDays(Math.min(366, Math.max(1, value)));
                        setFromDate('');
                    }}
                    onFromDateChange={(value) => {
                        setFromDate(value);
                    }}
                    onClear={() => {
                        setFromDate('');
                        setDays(14);
                    }}
                />
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
