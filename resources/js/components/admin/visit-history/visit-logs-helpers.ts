import { formatDisplayDate } from '@/components/ui/date-input';
import type { VisitLogVisit, VisitLogVisitor } from '@/types/dashboard';

export type VisitorTypeFilter = 'student' | 'employee';
export type SortColumn = 'schoolId' | 'name' | 'group' | 'visitCount' | 'lastVisit' | 'remaining' | 'progress';
export type SortDirection = 'asc' | 'desc';
export type VisitLogStatusFilter = 'all' | 'below' | 'met' | 'excess';
export type VisitorWithRangeVisits = VisitLogVisitor & { rangeVisits: VisitLogVisit[] };

export const defaultRowsPerPage = 5;

export const yearLevelOrder = [
    'Kindergarten 1',
    'Kindergarten 2',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
];

export function getAcademicDepartment(yearLevel?: string | null): string {
    if (!yearLevel) return 'Unassigned';
    if (yearLevel === 'Kindergarten 1' || yearLevel === 'Kindergarten 2') return 'Pre-school';
    if (['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].includes(yearLevel)) return 'Elementary';
    if (['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(yearLevel)) return 'High School';
    return 'Unassigned';
}

export function sortVisitors(visitors: VisitorWithRangeVisits[], column: SortColumn, direction: SortDirection) {
    return [...visitors].sort((first, second) => {
        const comparison = compareValues(sortValue(first, column), sortValue(second, column));

        return direction === 'asc' ? comparison : comparison * -1;
    });
}

export function visitsInDateRange(visits: VisitLogVisit[], startDate: string, endDate: string) {
    return visits
        .filter((visit) => {
            const visitedAt = parseVisitDate(visit.visitedAt);

            if (!visitedAt) {
                return false;
            }

            const visitDate = toLocalIsoDate(visitedAt);

            return (!startDate || visitDate >= startDate) && (!endDate || visitDate <= endDate);
        })
        .sort((first, second) => (parseVisitDate(second.visitedAt)?.getTime() ?? 0) - (parseVisitDate(first.visitedAt)?.getTime() ?? 0));
}

export function groupLabel(visitor: VisitLogVisitor) {
    if (visitor.type === 'employee') {
        return visitor.department || 'No department';
    }

    return [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'No year level or section';
}

export function summarizeDateRange(startDate: string, endDate: string) {
    if (startDate && endDate) {
        return `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`;
    }

    if (startDate) {
        return `From ${formatDisplayDate(startDate)}`;
    }

    if (endDate) {
        return `Until ${formatDisplayDate(endDate)}`;
    }

    return 'All active school-year dates';
}

export function formatVisitDateTime(value?: string | null) {
    const date = parseVisitDate(value);

    if (!date) {
        return '-';
    }

    return `${formatDisplayDate(toLocalIsoDate(date))}, ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
}

export function parseVisitDate(value?: string | null) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function toLocalIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function sortValue(visitor: VisitorWithRangeVisits, column: SortColumn) {
    if (column === 'schoolId') {
        return visitor.schoolId ?? '';
    }

    if (column === 'name') {
        return [visitor.lastName, visitor.firstName, visitor.name].filter(Boolean).join(' ');
    }

    if (column === 'visitCount') {
        return visitor.rangeVisits.length;
    }

    if (column === 'lastVisit') {
        return parseVisitDate(visitor.rangeVisits[0]?.visitedAt)?.getTime() ?? 0;
    }

    if (column === 'remaining') {
        return 0;
    }

    if (column === 'progress') {
        return 0;
    }

    if (visitor.type === 'student') {
        const yearLevelRank = yearLevelOrder.indexOf(visitor.yearLevel ?? '');

        return `${String(yearLevelRank >= 0 ? yearLevelRank : 99).padStart(2, '0')} ${visitor.section ?? ''}`;
    }

    return visitor.department ?? '';
}

function compareValues(first: string | number, second: string | number) {
    if (typeof first === 'number' && typeof second === 'number') {
        return first - second;
    }

    return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' });
}
