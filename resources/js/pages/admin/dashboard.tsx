import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { IconBadge } from '@/components/ui/icon-badge';
import { formatDisplayDate } from '@/components/ui/date-input';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type AdminDashboard, type ChartPoint, type RequiredProgressPoint } from '@/types/dashboard';
import { Head, Link } from '@inertiajs/react';
import type React from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import { Activity, BriefcaseBusiness, CalendarRange, GraduationCap, RadioTower, Target, UsersRound, type LucideIcon } from 'lucide-react';

interface DashboardProps {
    dashboard: AdminDashboard;
}

const trafficChartConfig = {
    students: {
        label: 'Students',
        color: 'var(--chart-1)',
    },
    employees: {
        label: 'Employees',
        color: 'var(--chart-2)',
    },
} satisfies ChartConfig;

const visitorMixChartConfig = {
    students: {
        label: 'Students',
        color: 'var(--chart-1)',
    },
    employees: {
        label: 'Employees',
        color: 'var(--chart-3)',
    },
} satisfies ChartConfig;

const studentGroupChartConfig = {
    value: {
        label: 'Visits',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig;

export default function Dashboard({ dashboard }: DashboardProps) {
    const schoolYearLabel = dashboard.schoolYear?.name ?? 'No school year';
    const schoolYearDates =
        dashboard.schoolYear?.starts_at && dashboard.schoolYear?.ends_at
            ? `${formatDisplayDate(dashboard.schoolYear.starts_at)} to ${formatDisplayDate(dashboard.schoolYear.ends_at)}`
            : 'Set up a school year to start tracking';
    const visitorMixData = [
        {
            key: 'students',
            label: 'Students',
            value: dashboard.visitorBreakdown.students,
            fill: 'var(--color-students)',
        },
        {
            key: 'employees',
            label: 'Employees',
            value: dashboard.visitorBreakdown.employees,
            fill: 'var(--color-employees)',
        },
    ];
    const hasTraffic = dashboard.charts.visitsByDay.some((point) => point.total > 0);
    const hasVisitorMix = visitorMixData.some((point) => point.value > 0);

    const overviewMetrics = [
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
                            {overviewMetrics.map((metric) => (
                                <MetricCard key={metric.label} {...metric} />
                            ))}
                        </section>

                        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.75fr)]">
                            <ChartCard
                                title="Visit Traffic"
                                detail={`${schoolYearLabel} attendance over the last 14 days`}
                                icon={CalendarRange}
                            >
                                {hasTraffic ? (
                                    <ChartContainer config={trafficChartConfig} className="h-76 w-full">
                                        <AreaChart data={dashboard.charts.visitsByDay} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="students-fill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-students)" stopOpacity={0.36} />
                                                    <stop offset="95%" stopColor="var(--color-students)" stopOpacity={0.04} />
                                                </linearGradient>
                                                <linearGradient id="employees-fill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-employees)" stopOpacity={0.32} />
                                                    <stop offset="95%" stopColor="var(--color-employees)" stopOpacity={0.04} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} strokeDasharray="4 4" />
                                            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                                            <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Area
                                                dataKey="students"
                                                type="monotone"
                                                stackId="visits"
                                                stroke="var(--color-students)"
                                                fill="url(#students-fill)"
                                                strokeWidth={2}
                                            />
                                            <Area
                                                dataKey="employees"
                                                type="monotone"
                                                stackId="visits"
                                                stroke="var(--color-employees)"
                                                fill="url(#employees-fill)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                ) : (
                                    <EmptyChartState message="No visits have been recorded in the last 14 days." />
                                )}
                            </ChartCard>

                            <ChartCard title="Visitor Mix" detail={schoolYearDates} icon={UsersRound}>
                                {hasVisitorMix ? (
                                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem] xl:grid-cols-1">
                                        <ChartContainer config={visitorMixChartConfig} className="mx-auto h-64 w-full max-w-sm">
                                            <PieChart>
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                <Pie
                                                    data={visitorMixData}
                                                    dataKey="value"
                                                    nameKey="label"
                                                    innerRadius={58}
                                                    outerRadius={92}
                                                    strokeWidth={5}
                                                >
                                                    {visitorMixData.map((entry) => (
                                                        <Cell key={entry.key} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ChartContainer>
                                        <div className="grid content-center gap-3">
                                            {visitorMixData.map((item) => (
                                                <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                                                    <span className="inline-flex items-center gap-2 font-medium text-[#020659]">
                                                        <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: item.fill }} />
                                                        {item.label}
                                                    </span>
                                                    <span className="text-lg font-semibold tabular-nums text-[#010440]">
                                                        {item.value.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyChartState message="Import students or employees to build this mix." />
                                )}
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

function MetricCard({
    label,
    value,
    detail,
    icon,
}: {
    label: string;
    value: number;
    detail: string;
    icon: LucideIcon;
}) {
    const Icon = icon;

    return (
        <article className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-[#030A8C]">{label}</p>
                    <p className="mt-3 text-4xl font-semibold tracking-normal text-[#010440]">{value.toLocaleString()}</p>
                    <p className="mt-3 truncate text-sm text-[#020659]/70">{detail}</p>
                </div>
                <IconBadge icon={Icon} />
            </div>
        </article>
    );
}

function ChartCard({
    title,
    detail,
    icon,
    children,
}: {
    title: string;
    detail: string;
    icon: LucideIcon;
    children: React.ReactNode;
}) {
    const Icon = icon;

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">{title}</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">{detail}</p>
                </div>
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                    <Icon className="size-5" />
                </span>
            </div>
            {children}
        </section>
    );
}

function HorizontalBarChart({ data, emptyMessage, labelWidth = 104 }: { data: ChartPoint[]; emptyMessage: string; labelWidth?: number }) {
    if (!data.some((point) => point.value > 0)) {
        return <EmptyChartState message={emptyMessage} />;
    }

    return (
        <ChartContainer config={studentGroupChartConfig} className="h-72 w-full">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={labelWidth}
                    tickMargin={10}
                    className="text-xs"
                />
                <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

function RequiredProgressPanel({ progress }: { progress: RequiredProgressPoint[] }) {
    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Required Visit Progress</h2>
                    <p className="text-sm text-[#020659]/70">Progress is measured against the required visits but does not limit scanning.</p>
                </div>
            </div>

            {progress.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {progress.map((item) => (
                        <article key={item.label} className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-[#010440]">{item.label}</p>
                                    <p className="mt-1 text-sm text-[#020659]/70">
                                        {item.met_required.toLocaleString()} of {item.visitors.toLocaleString()} met {item.required} visits
                                    </p>
                                </div>
                                <span className="text-2xl font-semibold tabular-nums text-[#010440]">{item.percent}%</span>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#040DBF]/10">
                                <div className="h-full rounded-full bg-[var(--chart-4)]" style={{ width: `${item.percent}%` }} />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-[#020659]/70">
                                <span>{item.visits.toLocaleString()} visits</span>
                                <span>{item.required_total.toLocaleString()} expected</span>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyChartState message="Configure an active school year to calculate required visit progress." />
            )}
        </section>
    );
}

function EmptyChartState({ message }: { message: string }) {
    return (
        <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-[#040DBF]/15 bg-[#f6f8ff]/70 px-4 text-center text-sm font-medium text-[#020659]/70">
            {message}
        </div>
    );
}
