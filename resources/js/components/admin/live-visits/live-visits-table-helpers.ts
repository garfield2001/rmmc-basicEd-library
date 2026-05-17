import type { DashboardVisit } from '@/types/dashboard';

export type VisitTab = 'student' | 'employee';
export type SortColumn = 'visitedAt' | 'schoolId' | 'name' | 'group';
export type SortDirection = 'asc' | 'desc';

export const defaultVisitsPerPage = 5;
export const virtualRowHeight = 73;
export const virtualOverscan = 8;

export function formatVisitTime(visit: DashboardVisit, mode: 'live' | 'history') {
    if (!visit.visitedAt) {
        return 'Pending';
    }

    const visitedAt = new Date(visit.visitedAt);

    if (mode === 'history') {
        return visitedAt.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
    }

    return visitedAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function uniqueVisitValues(visits: DashboardVisit[], key: 'yearLevel' | 'section'): string[] {
    return [...new Set(visits.map((visit) => visit.visitor[key]).filter((value): value is string => Boolean(value)))].sort((first, second) =>
        first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' }),
    );
}

export function sortLiveVisits(visits: DashboardVisit[], column: SortColumn, direction: SortDirection) {
    return [...visits].sort((first, second) => {
        const firstValue = sortValue(first, column);
        const secondValue = sortValue(second, column);
        const comparison = compareValues(firstValue, secondValue);

        return direction === 'asc' ? comparison : comparison * -1;
    });
}

function sortValue(visit: DashboardVisit, column: SortColumn) {
    if (column === 'visitedAt') {
        return visit.visitedAt ? new Date(visit.visitedAt).getTime() : 0;
    }

    if (column === 'schoolId') {
        return visit.visitor.schoolId ?? '';
    }

    if (column === 'name') {
        return visit.visitor.name ?? '';
    }

    return visit.visitor.type === 'student'
        ? [visit.visitor.yearLevel, visit.visitor.section].filter(Boolean).join(' ')
        : (visit.visitor.department ?? '');
}

function compareValues(first: string | number, second: string | number) {
    if (typeof first === 'number' && typeof second === 'number') {
        return first - second;
    }

    return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' });
}
