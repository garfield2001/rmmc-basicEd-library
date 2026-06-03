import { ActivityBreakdownCard } from '@/components/admin/dashboard/activity-breakdown-card';
import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { DashboardActions } from '@/components/admin/dashboard/dashboard-actions';
import { DashboardOperationsPanel } from '@/components/admin/dashboard/dashboard-operations-panel';
import { getOverviewMetrics, getSchoolYearDateRange } from '@/components/admin/dashboard/dashboard-summary';
import { MetricCard } from '@/components/admin/dashboard/metric-card';
import { RangeControls, rangeDetail, rangeLabel, relativeDateRange, visitsBetween } from '@/components/admin/dashboard/range-controls';
import { VisitTrafficChart } from '@/components/admin/dashboard/visit-traffic-chart';
import { VisitorMixChart } from '@/components/admin/dashboard/visitor-mix-chart';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type AdminDashboard, type VisitTrafficRange } from '@/types/dashboard';
import { Head, router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { CalendarRange, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';

interface DashboardProps {
    dashboard: AdminDashboard;
}

export default function Dashboard({ dashboard }: DashboardProps) {
    const schoolYearLabel = dashboard.schoolYear?.name ?? 'No school year';
    const schoolYearDates = getSchoolYearDateRange(dashboard);
    const metrics = getOverviewMetrics(dashboard, schoolYearLabel);
    const [trafficRange, setTrafficRange] = useState<VisitTrafficRange>('last14');
    const [trafficStartDate, setTrafficStartDate] = useState(() => relativeDateRange('last14')[0]);
    const [trafficEndDate, setTrafficEndDate] = useState(() => relativeDateRange('last14')[1]);
    const trafficData = useMemo(
        () => visitsBetween(dashboard.charts.dailyVisits, trafficStartDate, trafficEndDate),
        [dashboard.charts.dailyVisits, trafficEndDate, trafficStartDate],
    );
    const trafficTotal = useMemo(() => trafficData.reduce((sum, point) => sum + point.total, 0), [trafficData]);
    const trafficDetail = `${rangeDetail(trafficRange, trafficStartDate, trafficEndDate)} - ${trafficTotal.toLocaleString()} visits`;

    useEchoPublic('library-visits', '.LibraryVisitRecorded', () => {
        router.reload({ only: ['dashboard'] });
    });

    return (
        <>
            <Head title="Dashboard" />
            <main className="min-h-screen">
                <AdminLayout active="dashboard">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Dashboard"
                            description="A bird's-eye view of library visit operations, scanning activity, visitor coverage, and required progress."
                            actions={<DashboardActions requiredProgress={dashboard.charts.requiredProgress} />}
                        />

                        <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {metrics.map((metric) => (
                                <MetricCard key={metric.label} {...metric} />
                            ))}
                        </section>

                        <DashboardOperationsPanel dashboard={dashboard} scanSettings={dashboard.scanSettings} />

                        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(20rem,0.9fr)]">
                            <ChartCard
                                title="Visit Volume"
                                detail={trafficDetail}
                                icon={CalendarRange}
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
                                    emptyMessage={`No visits have been recorded for ${rangeLabel(trafficRange, trafficStartDate, trafficEndDate)}.`}
                                />
                            </ChartCard>

                            <ChartCard title="Visitor Mix" detail={schoolYearDates} icon={UsersRound}>
                                <VisitorMixChart students={dashboard.visitorBreakdown.students} employees={dashboard.visitorBreakdown.employees} />
                            </ChartCard>
                        </section>

                        <section className="min-w-0">
                            <ActivityBreakdownCard dashboard={dashboard} />
                        </section>
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
