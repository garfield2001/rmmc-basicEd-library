import { ActivityBreakdownCard } from '@/components/admin/dashboard/activity-breakdown-card';
import { ChartCard } from '@/components/admin/dashboard/chart-card';
import { DashboardActions } from '@/components/admin/dashboard/dashboard-actions';
import { getOverviewMetrics, getSchoolYearDateRange } from '@/components/admin/dashboard/dashboard-summary';
import { MetricCard } from '@/components/admin/dashboard/metric-card';
import { RangeControls, rangeDetail, rangeLabel, visitsBetween } from '@/components/admin/dashboard/range-controls';
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
    const [trafficStartDate, setTrafficStartDate] = useState('');
    const [trafficEndDate, setTrafficEndDate] = useState('');
    const trafficData = useMemo(
        () =>
            trafficRange === 'custom'
                ? visitsBetween(dashboard.charts.dailyVisits, trafficStartDate, trafficEndDate)
                : dashboard.charts.visitsByDay[trafficRange],
        [dashboard.charts.dailyVisits, dashboard.charts.visitsByDay, trafficEndDate, trafficRange, trafficStartDate],
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
                            description="A school-year view of registered visitors, visit traffic, and required visit progress."
                            actions={<DashboardActions requiredProgress={dashboard.charts.requiredProgress} />}
                        />

                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {metrics.map((metric) => (
                                <MetricCard key={metric.label} {...metric} />
                            ))}
                        </section>

                        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(20rem,0.9fr)]">
                            <ChartCard
                                title="Visit Traffic"
                                detail={trafficDetail}
                                icon={CalendarRange}
                                actions={
                                    <RangeControls
                                        value={trafficRange}
                                        startDate={trafficStartDate}
                                        endDate={trafficEndDate}
                                        minDate={dashboard.schoolYear?.starts_at}
                                        maxDate={dashboard.schoolYear?.ends_at}
                                        onRangeChange={setTrafficRange}
                                        onStartDateChange={(value) => {
                                            setTrafficStartDate(value);
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

                        <section>
                            <ActivityBreakdownCard dashboard={dashboard} />
                        </section>
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
