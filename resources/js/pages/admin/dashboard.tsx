import { IconBadge } from '@/components/ui/icon-badge';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type AdminDashboard, type ChartPoint } from '@/types/dashboard';
import { Head, Link } from '@inertiajs/react';
import { Activity, BriefcaseBusiness, GraduationCap, RadioTower, UserCheck, UsersRound } from 'lucide-react';

interface DashboardProps {
    dashboard: AdminDashboard;
}

function ChartList({ title, points }: { title: string; points: ChartPoint[] }) {
    const highestValue = Math.max(...points.map((point) => point.value), 1);

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-normal text-[#010440]">{title}</h2>
            <div className="mt-5 space-y-4">
                {points.map((point) => (
                    <div key={point.label}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium text-[#020659]">{point.label}</span>
                            <span className="text-[#030A8C]">{point.value.toLocaleString()}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#040DBF]/10">
                            <div
                                className="h-full rounded-full bg-[#040DBF]"
                                style={{ width: `${Math.max(6, (point.value / highestValue) * 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function Dashboard({ dashboard }: DashboardProps) {
    const overviewMetrics = [
        {
            label: 'Active members',
            value: dashboard.metrics.activeMembers,
            detail: 'Can record library visits',
            icon: UsersRound,
        },
        {
            label: 'Visits today',
            value: dashboard.metrics.visitsToday,
            detail: 'Recorded since midnight',
            icon: Activity,
        },
        {
            label: 'Enrolled students',
            value: dashboard.metrics.enrolledStudents,
            detail: dashboard.schoolYear?.name ?? 'No active school year',
            icon: UserCheck,
        },
        {
            label: 'Employee members',
            value: dashboard.metrics.employeeMembers,
            detail: 'Faculty and staff profiles',
            icon: BriefcaseBusiness,
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <main className="min-h-screen">
                <AdminLayout active="dashboard">
                    <div className="space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Dashboard"
                            description="Overview of member coverage, visit activity, and school-year attendance trends."
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
                            {overviewMetrics.map((metric) => {
                                const Icon = metric.icon;

                                return (
                                    <div key={metric.label} className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-[#030A8C]">{metric.label}</p>
                                                <p className="mt-3 text-4xl font-semibold tracking-normal text-[#010440]">
                                                    {metric.value.toLocaleString()}
                                                </p>
                                            </div>
                                            <IconBadge icon={Icon} />
                                        </div>
                                        <p className="mt-3 text-sm text-[#020659]/70">{metric.detail}</p>
                                    </div>
                                );
                            })}
                        </section>

                        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                            <ChartList title="Visits over the last 7 days" points={dashboard.charts.visitsByDay} />

                            <div className="grid gap-4">
                                <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Member breakdown</h2>
                                    <div className="mt-5 grid gap-3">
                                        <div className="flex items-center justify-between rounded-lg bg-[#f6f8ff] p-4">
                                            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#020659]">
                                                <GraduationCap className="size-4 text-[#040DBF]" />
                                                Students
                                            </span>
                                            <span className="text-xl font-semibold text-[#010440]">{dashboard.memberBreakdown.students}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-[#f6f8ff] p-4">
                                            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#020659]">
                                                <BriefcaseBusiness className="size-4 text-[#040DBF]" />
                                                Employees
                                            </span>
                                            <span className="text-xl font-semibold text-[#010440]">{dashboard.memberBreakdown.employees}</span>
                                        </div>
                                    </div>
                                </section>

                                <ChartList title="Visits by type" points={dashboard.charts.visitsByType} />
                            </div>
                        </section>

                        <ChartList title="Top student year levels" points={dashboard.charts.studentVisitsByYearLevel} />
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
