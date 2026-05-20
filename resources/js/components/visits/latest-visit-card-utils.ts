import { type DashboardVisit } from '@/types/dashboard';

export const visitFallback = '-';

export function formatVisitTime(visit: DashboardVisit) {
    return visit.visitedAt
        ? new Date(visit.visitedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Pending';
}

export function formatVisitDateTime(visit: DashboardVisit) {
    return visit.visitedAt
        ? new Date(visit.visitedAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Pending';
}

export function visitorTypeLabel(visit: DashboardVisit) {
    if (visit.visitor.type === 'student') {
        return 'Student';
    }

    if (visit.visitor.type === 'employee') {
        return 'Employee';
    }

    return 'Unknown visitor type';
}

export function academicOrWorkDetail(visit: DashboardVisit) {
    if (visit.visitor.type === 'student') {
        return [visit.visitor.yearLevel, visit.visitor.section].filter(Boolean).join(' - ') || visitFallback;
    }

    return visit.visitor.department || visitFallback;
}
