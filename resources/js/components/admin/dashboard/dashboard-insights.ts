import type { VisitTrendPoint } from '@/types/dashboard';

export interface DashboardInsight {
    label: string;
    value: string;
    detail: string;
}

export function getDashboardInsights(dailyVisits: VisitTrendPoint[]): DashboardInsight[] {
    const totalVisits = dailyVisits.reduce((sum, point) => sum + point.total, 0);
    const activeDays = dailyVisits.filter((point) => point.total > 0).length;
    const busiestDay = dailyVisits.reduce<VisitTrendPoint | null>((busiest, point) => {
        return !busiest || point.total > busiest.total ? point : busiest;
    }, null);

    return [
        {
            label: 'School-year visits',
            value: totalVisits.toLocaleString(),
            detail: 'All recorded student and employee scans',
        },
        {
            label: 'Busiest day',
            value: busiestDay && busiestDay.total > 0 ? busiestDay.total.toLocaleString() : '0',
            detail: busiestDay && busiestDay.total > 0 ? busiestDay.label : 'No visits recorded yet',
        },
        {
            label: 'Active-day average',
            value: activeDays > 0 ? Math.round(totalVisits / activeDays).toLocaleString() : '0',
            detail: `${activeDays.toLocaleString()} day${activeDays === 1 ? '' : 's'} with visits`,
        },
    ];
}
