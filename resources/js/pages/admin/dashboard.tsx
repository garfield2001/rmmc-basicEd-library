import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { HorizontalBarChart } from '@/components/admin/dashboard/horizontal-bar-chart';
import { MetricCard } from '@/components/admin/dashboard/metric-card';
import { RequiredProgressPanel } from '@/components/admin/dashboard/required-progress-panel';
import { VisitTrafficChart } from '@/components/admin/dashboard/visit-traffic-chart';
import { VisitorMixChart } from '@/components/admin/dashboard/visitor-mix-chart';
import { formatDisplayDate } from '@/components/ui/date-input';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type AdminDashboard, type VisitTrafficRange } from '@/types/dashboard';
import { Head, Link } from '@inertiajs/react';
import { Activity, BriefcaseBusiness, CalendarRange, GraduationCap, RadioTower, Target, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';

interface DashboardProps {
    dashboard: AdminDashboard;
}

export default function Dashboard({ dashboard }: DashboardProps) {
    const schoolYearLabel = dashboard.schoolYear?.name ?? 'No school year';
    const schoolYearDates = getSchoolYearDateRange(dashboard);
    const metrics = getOverviewMetrics(dashboard, schoolYearLabel);
    const [trafficRange, setTrafficRange] = useState<VisitTrafficRange>('last14');
    const [showAllYearLevels, setShowAllYearLevels] = useState(false);
    const [showAllSections, setShowAllSections] = useState(false);
    const [showAllDepartments, setShowAllDepartments] = useState(false);
    const trafficData = dashboard.charts.visitsByDay[trafficRange] ?? [];
    const trafficTotal = useMemo(() => trafficData.reduce((sum, point) => sum + point.total, 0), [trafficData]);
    const trafficDetail = `${trafficRangeOptions[trafficRange].detail} - ${trafficTotal.toLocaleString()} visits`;
    const yearLevelData = showAllYearLevels ? dashboard.charts.studentVisitsByYearLevel : dashboard.charts.studentVisitsByYearLevel.slice(0, 6);
    const sectionData = showAllSections ? dashboard.charts.studentVisitsBySection : dashboard.charts.studentVisitsBySection.slice(0, 6);
    const departmentData = showAllDepartments ? dashboard.charts.employeeVisitsByDepartment : dashboard.charts.employeeVisitsByDepartment.slice(0, 6);

    return (
        <>
            <Head title="Dashboard" />
            <main className="min-h-screen">
                <AdminLayout active="dashboard">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Dashboard"
                            description="A school-year view of registered visitors, visit traffic, and required visit progress."
                            actions={
                                <Link
                                    href="/admin/live-visits"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#040DBF] px-4 text-sm font-medium text-white shadow-sm shadow-[#040DBF]/20 hover:bg-[#030A8C]"
                                >
                                    <RadioTower className="size-4" />
                                    Open live visits
                                </Link>
                            }
                        />

                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {metrics.map((metric) => (
                                <MetricCard key={metric.label} {...metric} />
                            ))}
                        </section>

                        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.75fr)]">
                            <ChartCard
                                title="Visit Traffic"
                                detail={trafficDetail}
                                icon={CalendarRange}
                                actions={<TrafficRangeTabs value={trafficRange} onChange={setTrafficRange} />}
                            >
                                <VisitTrafficChart data={trafficData} emptyMessage={`No visits have been recorded in the ${trafficRangeOptions[trafficRange].label}.`} />
                            </ChartCard>

                            <ChartCard title="Visitor Mix" detail={schoolYearDates} icon={UsersRound}>
                                <VisitorMixChart students={dashboard.visitorBreakdown.students} employees={dashboard.visitorBreakdown.employees} />
                            </ChartCard>
                        </section>

                        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <ChartCard
                                title="Year Level Activity"
                                detail="Student visits in the active school year"
                                icon={GraduationCap}
                                actions={
                                    <SeeMoreButton
                                        total={dashboard.charts.studentVisitsByYearLevel.length}
                                        expanded={showAllYearLevels}
                                        onClick={() => setShowAllYearLevels((value) => !value)}
                                    />
                                }
                            >
                                <HorizontalBarChart
                                    data={yearLevelData}
                                    emptyMessage="Student visits by year level will appear after scanning."
                                />
                            </ChartCard>

                            <ChartCard
                                title="Section Activity"
                                detail="Student section visits in the active school year"
                                icon={Target}
                                actions={
                                    <SeeMoreButton
                                        total={dashboard.charts.studentVisitsBySection.length}
                                        expanded={showAllSections}
                                        onClick={() => setShowAllSections((value) => !value)}
                                    />
                                }
                            >
                                <HorizontalBarChart
                                    data={sectionData}
                                    emptyMessage="Section-level visit trends will appear after scanning students."
                                    labelWidth={150}
                                />
                            </ChartCard>
                        </section>

                        <section>
                            <ChartCard
                                title="Department Activity"
                                detail="Employee department visits in the active school year"
                                icon={BriefcaseBusiness}
                                actions={
                                    <SeeMoreButton
                                        total={dashboard.charts.employeeVisitsByDepartment.length}
                                        expanded={showAllDepartments}
                                        onClick={() => setShowAllDepartments((value) => !value)}
                                    />
                                }
                            >
                                <HorizontalBarChart
                                    data={departmentData}
                                    emptyMessage="Department-level visit trends will appear after scanning employees."
                                    labelWidth={220}
                                />
                            </ChartCard>
                        </section>

                        <RequiredProgressPanel progress={dashboard.charts.requiredProgress} />
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}

function SeeMoreButton({ total, expanded, onClick }: { total: number; expanded: boolean; onClick: () => void }) {
    if (total <= 6) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3 py-1.5 text-xs font-semibold text-[#020659] transition hover:border-[#040DBF]/25 hover:bg-white hover:text-[#010440]"
        >
            {expanded ? 'Show top 6' : `See all ${total}`}
        </button>
    );
}

const trafficRangeOptions: Record<VisitTrafficRange, { label: string; detail: string }> = {
    last7: {
        label: 'last 7 days',
        detail: 'Student and employee visits over the last 7 days',
    },
    last14: {
        label: 'last 14 days',
        detail: 'Student and employee visits over the last 14 days',
    },
    lastMonth: {
        label: 'last 30 days',
        detail: 'Student and employee visits over the last 30 days',
    },
};

function TrafficRangeTabs({ value, onChange }: { value: VisitTrafficRange; onChange: (value: VisitTrafficRange) => void }) {
    return (
        <div className="admin-segmented-tabs flex rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-1">
            {(Object.keys(trafficRangeOptions) as VisitTrafficRange[]).map((range) => (
                <button
                    key={range}
                    type="button"
                    onClick={() => onChange(range)}
                    className={`admin-segmented-tab rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                        value === range ? 'admin-segmented-tab-active' : 'text-[#020659]/75 hover:bg-white hover:text-[#010440]'
                    }`}
                >
                    {trafficRangeOptions[range].label.replace('last ', '')}
                </button>
            ))}
        </div>
    );
}

function getSchoolYearDateRange(dashboard: AdminDashboard) {
    if (dashboard.schoolYear?.starts_at && dashboard.schoolYear?.ends_at) {
        return `${formatDisplayDate(dashboard.schoolYear.starts_at)} to ${formatDisplayDate(dashboard.schoolYear.ends_at)}`;
    }

    return 'Set up a school year to start tracking';
}

function getOverviewMetrics(dashboard: AdminDashboard, schoolYearLabel: string) {
    return [
        {
            label: 'Registered visitors',
            value: dashboard.metrics.registeredVisitors,
            detail: schoolYearLabel,
            icon: UsersRound,
        },
        {
            label: 'Visits today',
            value: dashboard.metrics.visitsToday,
            detail: 'Recorded since midnight',
            icon: Activity,
        },
        {
            label: 'Student profiles',
            value: dashboard.metrics.studentRegistrations,
            detail: `${dashboard.schoolYear?.student_required_visits ?? 0} required visits`,
            icon: GraduationCap,
        },
        {
            label: 'Employee profiles',
            value: dashboard.metrics.employeeVisitors,
            detail: `${dashboard.schoolYear?.employee_required_visits ?? 0} required visits`,
            icon: BriefcaseBusiness,
        },
    ];
}
