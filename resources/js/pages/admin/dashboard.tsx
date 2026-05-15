import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { HorizontalBarChart } from '@/components/admin/dashboard/horizontal-bar-chart';
import { MetricCard } from '@/components/admin/dashboard/metric-card';
import { RequiredProgressPanel } from '@/components/admin/dashboard/required-progress-panel';
import { VisitTrafficChart } from '@/components/admin/dashboard/visit-traffic-chart';
import { VisitorMixChart } from '@/components/admin/dashboard/visitor-mix-chart';
import { formatDisplayDate } from '@/components/ui/date-input';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type AdminDashboard } from '@/types/dashboard';
import { Head, Link } from '@inertiajs/react';
import { Activity, BriefcaseBusiness, CalendarRange, GraduationCap, RadioTower, Target, UsersRound } from 'lucide-react';

interface DashboardProps {
    dashboard: AdminDashboard;
}

export default function Dashboard({ dashboard }: DashboardProps) {
    const schoolYearLabel = dashboard.schoolYear?.name ?? 'No school year';
    const schoolYearDates = getSchoolYearDateRange(dashboard);
    const metrics = getOverviewMetrics(dashboard, schoolYearLabel);

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
                            <ChartCard title="Visit Traffic" detail={`${schoolYearLabel} attendance over the last 14 days`} icon={CalendarRange}>
                                <VisitTrafficChart data={dashboard.charts.visitsByDay} />
                            </ChartCard>

                            <ChartCard title="Visitor Mix" detail={schoolYearDates} icon={UsersRound}>
                                <VisitorMixChart students={dashboard.visitorBreakdown.students} employees={dashboard.visitorBreakdown.employees} />
                            </ChartCard>
                        </section>

                        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <ChartCard title="Year Level Activity" detail="Top student year levels by visits" icon={GraduationCap}>
                                <HorizontalBarChart
                                    data={dashboard.charts.studentVisitsByYearLevel}
                                    emptyMessage="Student visits by year level will appear after scanning."
                                />
                            </ChartCard>

                            <ChartCard title="Section Activity" detail="Top sections by student visits" icon={Target}>
                                <HorizontalBarChart
                                    data={dashboard.charts.studentVisitsBySection}
                                    emptyMessage="Section-level visit trends will appear after scanning students."
                                    labelWidth={128}
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
