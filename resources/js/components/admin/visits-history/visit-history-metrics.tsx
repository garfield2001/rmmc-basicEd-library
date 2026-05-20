import { HistoryMetricCard } from '@/components/admin/visits-history/visit-history-ui';
import type { AdminVisitHistory } from '@/types/dashboard';
import { BriefcaseBusiness, GraduationCap, UserRound } from 'lucide-react';

interface VisitHistoryMetricsProps {
    metrics: AdminVisitHistory['metrics'];
    rangeMetrics: {
        studentVisits: number;
        employeeVisits: number;
    };
}

export function VisitHistoryMetrics({ metrics, rangeMetrics }: VisitHistoryMetricsProps) {
    return (
        <section className="grid gap-4 md:grid-cols-3">
            <HistoryMetricCard icon={UserRound} label="Visitors" value={metrics.visitors} detail="Active school year roster" />
            <HistoryMetricCard icon={GraduationCap} label="Student visits" value={rangeMetrics.studentVisits} detail="Selected date coverage" />
            <HistoryMetricCard icon={BriefcaseBusiness} label="Employee visits" value={rangeMetrics.employeeVisits} detail="Selected date coverage" />
        </section>
    );
}
