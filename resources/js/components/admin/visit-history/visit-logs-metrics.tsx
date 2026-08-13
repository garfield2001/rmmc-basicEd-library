import { HistoryMetricCard } from '@/components/admin/visit-history/visit-logs-ui';
import type { AdminVisitLogs } from '@/types/dashboard';
import { BriefcaseBusiness, GraduationCap, UserRound } from 'lucide-react';
import type { VisitorTypeFilter } from './visit-logs-helpers';

interface VisitLogsMetricsProps {
    metrics: AdminVisitLogs['metrics'];
    rangeMetrics: {
        studentVisits: number;
        employeeVisits: number;
        studentVisitors: number;
        employeeVisitors: number;
        activeStudentVisitors: number;
        activeEmployeeVisitors: number;
    };
    visitorType: VisitorTypeFilter;
}

export function VisitLogsMetrics({ metrics, rangeMetrics, visitorType }: VisitLogsMetricsProps) {
    const isEmployee = visitorType === 'employee';
    const rosterCount = isEmployee ? metrics.employeeVisitors : metrics.studentVisitors;
    const visitCount = isEmployee ? rangeMetrics.employeeVisits : rangeMetrics.studentVisits;
    const activeVisitors = isEmployee ? rangeMetrics.activeEmployeeVisitors : rangeMetrics.activeStudentVisitors;
    const noVisitCount = Math.max(0, rosterCount - activeVisitors);
    const audienceLabel = isEmployee ? 'Employee' : 'Student';
    const AudienceIcon = isEmployee ? BriefcaseBusiness : GraduationCap;

    return (
        <section className="grid gap-4 md:grid-cols-3">
            <HistoryMetricCard icon={AudienceIcon} label={`${audienceLabel}s`} value={rosterCount} detail="Active school year roster" />
            <HistoryMetricCard icon={UserRound} label={`${audienceLabel} visits`} value={visitCount} detail="From selected date to today" />
            <HistoryMetricCard icon={UserRound} label="No visits yet" value={noVisitCount} detail="People without visits in this coverage" />
        </section>
    );
}
