import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { HorizontalBarChart } from '@/components/admin/dashboard/horizontal-bar-chart';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { AdminDashboard, StudentActivityVisit } from '@/types/dashboard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
    const [yearLevelFilter, setYearLevelFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const studentActivityVisits = useMemo(
        () => filterStudentActivityVisits(dashboard.charts.studentActivityVisits, dashboard.schoolYear?.starts_at ?? '', dashboard.schoolYear?.ends_at ?? ''),
        [dashboard.charts.studentActivityVisits, dashboard.schoolYear?.ends_at, dashboard.schoolYear?.starts_at],
    );
    const departmentActivityVisits = useMemo(
        () => filterEmployeeActivityVisits(dashboard.charts.employeeActivityVisits, dashboard.schoolYear?.starts_at ?? '', dashboard.schoolYear?.ends_at ?? ''),
        [dashboard.charts.employeeActivityVisits, dashboard.schoolYear?.ends_at, dashboard.schoolYear?.starts_at],
    );
    const studentFilterOptions = useMemo(() => studentActivityFilterOptions(studentActivityVisits, dashboard.charts.activityGroups.yearLevels), [
        dashboard.charts.activityGroups.yearLevels,
        studentActivityVisits,
    ]);
    const availableSectionFilters = useMemo(
        () =>
            studentFilterOptions.sections.filter((option) => {
                if (!yearLevelFilter) {
                    return true;
                }

                return option.yearLevel === yearLevelFilter;
            }),
        [studentFilterOptions.sections, yearLevelFilter],
    );
    const departmentFilterOptions = useMemo(
        () => distinctSorted(departmentActivityVisits.map((visit) => visit.department), dashboard.charts.activityGroups.departments),
        [dashboard.charts.activityGroups.departments, departmentActivityVisits],
    );
    const filteredStudentActivityVisits = useMemo(
        () =>
            studentActivityVisits.filter(
                (visit) =>
                    (!yearLevelFilter || visit.yearLevel === yearLevelFilter) &&
                    (!sectionFilter || `${visit.yearLevel ?? 'Unassigned'}|${visit.section ?? 'Unassigned'}` === sectionFilter),
            ),
        [sectionFilter, studentActivityVisits, yearLevelFilter],
    );
    const filteredDepartmentActivityVisits = useMemo(
        () => departmentActivityVisits.filter((visit) => !departmentFilter || (visit.department ?? 'Unassigned') === departmentFilter),
        [departmentActivityVisits, departmentFilter],
    );
    const allYearLevelData = useMemo(
        () => groupStudentActivity(filteredStudentActivityVisits, 'yearLevel', dashboard.charts.activityGroups.yearLevels),
        [dashboard.charts.activityGroups.yearLevels, filteredStudentActivityVisits],
    );
    const allSectionData = useMemo(
        () => groupStudentActivity(filteredStudentActivityVisits, 'section', dashboard.charts.activityGroups.sections),
        [dashboard.charts.activityGroups.sections, filteredStudentActivityVisits],
    );
    const allDepartmentData = useMemo(
        () => groupEmployeeActivity(filteredDepartmentActivityVisits, dashboard.charts.activityGroups.departments),
        [dashboard.charts.activityGroups.departments, filteredDepartmentActivityVisits],
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
    const usesStudentFilters = activeActivity === 'yearLevel' || activeActivity === 'section';

    useEffect(() => {
        if (!availableSectionFilters.some((option) => option.value === sectionFilter)) {
            setSectionFilter('');
        }
    }, [availableSectionFilters, sectionFilter]);

    useEffect(() => {
        setShowAllActivity(false);
    }, [activeActivity, departmentFilter, sectionFilter, yearLevelFilter]);

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
                <div className="mb-4 flex flex-wrap gap-2">
                    {usesStudentFilters ? (
                        <>
                            <ActivityFilterSelect label="Year level" value={yearLevelFilter} onChange={setYearLevelFilter}>
                                <option value="">All year levels</option>
                                {studentFilterOptions.yearLevels.map((yearLevel) => (
                                    <option key={yearLevel} value={yearLevel}>
                                        {yearLevel}
                                    </option>
                                ))}
                            </ActivityFilterSelect>
                            <ActivityFilterSelect label="Section" value={sectionFilter} onChange={setSectionFilter}>
                                <option value="">All sections</option>
                                {availableSectionFilters.map((section) => (
                                    <option key={section.value} value={section.value}>
                                        {section.label}
                                    </option>
                                ))}
                            </ActivityFilterSelect>
                        </>
                    ) : (
                        <ActivityFilterSelect label="Department" value={departmentFilter} onChange={setDepartmentFilter}>
                            <option value="">All departments</option>
                            {departmentFilterOptions.map((department) => (
                                <option key={department} value={department}>
                                    {department}
                                </option>
                            ))}
                        </ActivityFilterSelect>
                    )}
                </div>
                <div>
                    <HorizontalBarChart data={activityData} emptyMessage={activityPanel.emptyMessage} labelWidth={activityLabelWidth} height={chartHeight} />
                </div>
            </div>
        </ChartCard>
    );
}

function ActivityFilterSelect({
    label,
    value,
    onChange,
    children,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
}) {
    return (
        <label className="grid min-w-44 gap-1 text-xs font-semibold text-[#020659]/70">
            {label}
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 rounded-lg border border-[#040DBF]/10 bg-white px-3 text-sm font-medium text-[#010440] outline-none transition focus:border-[#040DBF]/35 focus:ring-4 focus:ring-[#040DBF]/10"
            >
                {children}
            </select>
        </label>
    );
}

function studentActivityFilterOptions(visits: StudentActivityVisit[], yearLevelLabels: string[]) {
    const yearLevels = distinctSorted(visits.map((visit) => visit.yearLevel), yearLevelLabels);
    const sections = visits
        .map((visit) => ({
            yearLevel: visit.yearLevel ?? 'Unassigned',
            section: visit.section ?? 'Unassigned',
            label: [visit.yearLevel, visit.section].filter(Boolean).join(' - ') || 'Unassigned',
            value: `${visit.yearLevel ?? 'Unassigned'}|${visit.section ?? 'Unassigned'}`,
        }))
        .filter((option, index, options) => options.findIndex((candidate) => candidate.value === option.value) === index)
        .sort((first, second) => first.label.localeCompare(second.label, undefined, { numeric: true, sensitivity: 'base' }));

    return { yearLevels, sections };
}

function distinctSorted(values: Array<string | null>, preferredOrder: string[] = []) {
    const preferred = new Set(preferredOrder.filter(Boolean));
    const valueSet = new Set([...preferredOrder, ...values.map((value) => value ?? 'Unassigned')].filter(Boolean));

    return [...valueSet].sort((first, second) => {
        const firstPreferredIndex = preferredOrder.indexOf(first);
        const secondPreferredIndex = preferredOrder.indexOf(second);

        if (preferred.has(first) && preferred.has(second)) {
            return firstPreferredIndex - secondPreferredIndex;
        }

        if (preferred.has(first)) {
            return -1;
        }

        if (preferred.has(second)) {
            return 1;
        }

        return first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });
    });
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
