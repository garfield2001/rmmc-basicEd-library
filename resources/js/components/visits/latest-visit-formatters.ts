import { type DashboardVisit } from '@/types/dashboard';

const latestVisitFallback = '-';

export function formatVisitTime(visit: DashboardVisit) {
    return visit.visitedAt
        ? new Date(visit.visitedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Pending';
}

export function academicOrWorkDetail(visit: DashboardVisit) {
    if (visit.visitor.type === 'student') {
        return [visit.visitor.yearLevel, visit.visitor.section].filter(Boolean).join(' - ') || latestVisitFallback;
    }

    return visit.visitor.department || latestVisitFallback;
}
