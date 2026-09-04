import { ActivityBreakdownCard } from '@/components/admin/dashboard/activity-breakdown-card';
import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { DashboardActions } from '@/components/admin/dashboard/dashboard-actions';
import { formatTime, getSchoolYearDateRange } from '@/components/admin/dashboard/dashboard-summary';
import { RangeControls, rangeDetail, rangeLabel, relativeDateRange, visitsBetween } from '@/components/admin/dashboard/range-controls';
import { SectionLeaderboardCard } from '@/components/admin/dashboard/section-leaderboard-card';
import { VisitTrafficChart } from '@/components/admin/dashboard/visit-traffic-chart';
import { VisitorMixChart } from '@/components/admin/dashboard/visitor-mix-chart';
import { ScanSettingsForm } from '@/components/admin/settings/scan-settings-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type AdminDashboard, type VisitTrafficRange } from '@/types/dashboard';
import { Head, Link, router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { Activity, Calendar, CalendarClock, Clock3, RadioTower, SlidersHorizontal, Users, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';

interface DashboardProps {
    dashboard: AdminDashboard;
}

export default function Dashboard({ dashboard }: DashboardProps) {
    const schoolYearLabel = dashboard.schoolYear?.name ?? 'No school year';
    const schoolYearDates = getSchoolYearDateRange(dashboard);
    const [scanRulesModalOpen, setScanRulesModalOpen] = useState(false);

    const [trafficRange, setTrafficRange] = useState<VisitTrafficRange>('last14');
    const [trafficStartDate, setTrafficStartDate] = useState(() => relativeDateRange('last14')[0]);
    const [trafficEndDate, setTrafficEndDate] = useState(() => relativeDateRange('last14')[1]);

    const trafficData = useMemo(
        () => visitsBetween(dashboard.charts.dailyVisits, trafficStartDate, trafficEndDate),
        [dashboard.charts.dailyVisits, trafficEndDate, trafficStartDate],
    );
    const trafficTotal = useMemo(() => trafficData.reduce((sum, point) => sum + point.total, 0), [trafficData]);
    const trafficDetail = `${rangeDetail(trafficRange, trafficStartDate, trafficEndDate)} • ${trafficTotal.toLocaleString()} visits`;

    const sectionLeaderboard = useMemo(() => dashboard.charts.studentVisitsBySection ?? [], [dashboard.charts.studentVisitsBySection]);

    useEchoPublic('library-visits', '.LibraryVisitRecorded', () => {
        router.reload({ only: ['dashboard'] });
    });

    return (
        <>
            <Head title="Dashboard Overview" />
            <main className="min-h-screen">
                <AdminLayout active="dashboard">
                    <div className="admin-content-shell mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        {/* Page Header */}
                        <AdminPageHeader
                            title="Dashboard Overview"
                            description="Comprehensive library operations command center, school-year visit performance, visitor demographic mix, and section rankings."
                            badge={
                                <Link
                                    href="/admin/live-visits"
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                                >
                                    <span className="relative flex size-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                    </span>
                                    <span>Live Visits Terminal</span>
                                    <RadioTower className="size-3.5" />
                                </Link>
                            }
                            actions={
                                <DashboardActions
                                    requiredProgress={dashboard.charts.requiredProgress}
                                    individualProgress={dashboard.charts.individualProgress}
                                />
                            }
                        />

                        {/* Inline Executive Statistics Strip (Seamless, Zero Cards) */}
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-[#040DBF]/10 bg-white/95 px-4 py-3 text-xs font-semibold text-slate-700 shadow-xs sm:px-5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                {/* 1. Active School Year */}
                                <div className="flex items-center gap-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-blue-50 text-[#040DBF] dark:bg-blue-950/50 dark:text-blue-400">
                                        <Calendar className="size-3.5" />
                                    </span>
                                    <span className="font-medium text-slate-500 dark:text-slate-400">School Year:</span>
                                    <span className="font-extrabold text-[#010440] dark:text-white">{schoolYearLabel}</span>
                                </div>

                                <div className="hidden h-3.5 w-px bg-slate-200 sm:block dark:bg-slate-700" />

                                {/* 2. Visits Today */}
                                <div className="flex items-center gap-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                        <Activity className="size-3.5" />
                                    </span>
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Visits Today:</span>
                                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {dashboard.metrics.visitsToday.toLocaleString()}
                                    </span>
                                </div>

                                <div className="hidden h-3.5 w-px bg-slate-200 sm:block dark:bg-slate-700" />

                                {/* 3. Registered Visitors (Students & Employees) */}
                                <div className="flex items-center gap-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                        <UsersRound className="size-3.5" />
                                    </span>
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Registered:</span>
                                    <span className="font-extrabold text-[#010440] dark:text-white">
                                        {dashboard.metrics.registeredVisitors.toLocaleString()}
                                    </span>
                                    <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                                        ({dashboard.visitorBreakdown.students} students • {dashboard.visitorBreakdown.employees} staff)
                                    </span>
                                </div>
                            </div>

                            {/* 4. Scan Window + Rule Trigger (Replaces clumsy right drawer) */}
                            <div className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                                <Clock3 className="size-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Scan Window:</span>
                                <span className="font-bold text-[#010440] dark:text-white">
                                    {formatTime(dashboard.scanWindow.starts_at)} - {formatTime(dashboard.scanWindow.ends_at)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setScanRulesModalOpen(true)}
                                    className="ml-1 inline-flex items-center gap-1 rounded-md bg-[#040DBF]/10 px-2 py-0.5 text-[11px] font-bold text-[#040DBF] transition hover:bg-[#040DBF]/20 dark:bg-sky-500/20 dark:text-sky-300 dark:hover:bg-sky-500/30"
                                >
                                    <SlidersHorizontal className="size-3" />
                                    <span>Rules</span>
                                </button>
                            </div>
                        </div>

                        {/* Visual Analytics Row: Trajectory Trend (Area Chart) & Demographic Composition (Donut Chart) */}
                        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(20rem,0.9fr)]">
                            <ChartCard
                                title="Visit Volume Trends"
                                detail={trafficDetail}
                                icon={CalendarClock}
                                actions={
                                    <RangeControls
                                        value={trafficRange}
                                        startDate={trafficStartDate}
                                        endDate={trafficEndDate}
                                        minDate={dashboard.schoolYear?.starts_at}
                                        maxDate={dashboard.schoolYear?.ends_at}
                                        onRangeChange={(range) => {
                                            setTrafficRange(range);
                                            if (range !== 'custom') {
                                                const [start, end] = relativeDateRange(range);
                                                setTrafficStartDate(start);
                                                setTrafficEndDate(end);
                                            } else {
                                                setTrafficStartDate(dashboard.schoolYear?.starts_at ?? '');
                                                setTrafficEndDate(new Date().toISOString().slice(0, 10));
                                            }
                                        }}
                                        onStartDateChange={(value) => {
                                            setTrafficStartDate(value);
                                            setTrafficEndDate(new Date().toISOString().slice(0, 10));
                                            setTrafficRange('custom');
                                        }}
                                        onEndDateChange={(value) => {
                                            setTrafficEndDate(value);
                                            setTrafficRange('custom');
                                        }}
                                    />
                                }
                            >
                                <VisitTrafficChart
                                    data={trafficData}
                                    emptyMessage={`No visits recorded for ${rangeLabel(trafficRange, trafficStartDate, trafficEndDate)}.`}
                                />
                            </ChartCard>

                            <ChartCard title="Visitor Demographic Mix" detail={schoolYearDates} icon={Users}>
                                <VisitorMixChart students={dashboard.visitorBreakdown.students} employees={dashboard.visitorBreakdown.employees} />
                            </ChartCard>
                        </section>

                        {/* Operational Activity Row: Top Sections Recognition & Multi-Tab Academic Breakdown */}
                        <section className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(19rem,1fr)_minmax(0,1.9fr)]">
                            <SectionLeaderboardCard sections={sectionLeaderboard} />
                            <ActivityBreakdownCard dashboard={dashboard} />
                        </section>
                    </div>

                    {/* Scan Rules Modal (Clean Centered Modal dialog instead of right drawer) */}
                    <Dialog open={scanRulesModalOpen} onOpenChange={setScanRulesModalOpen}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <SlidersHorizontal className="size-5 text-[#040DBF] dark:text-sky-400" />
                                    <span>Library RFID Scan Settings</span>
                                </DialogTitle>
                                <DialogDescription>
                                    Configure operating scan hours, cooldown times, and duplicate scan interval windows.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-2">
                                <ScanSettingsForm settings={dashboard.scanSettings} noWrapper={true} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </AdminLayout>
            </main>
        </>
    );
}
