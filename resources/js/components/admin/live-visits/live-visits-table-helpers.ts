import type { DashboardVisit } from '@/types/dashboard';

export type VisitTab = 'student' | 'employee';
export type LiveVisitsTableMode = 'live' | 'history';
export type SortColumn = 'visitedAt' | 'schoolId' | 'name' | 'group';
export type SortDirection = 'asc' | 'desc';

export const defaultVisitsPerPage = 5;
export const virtualRowHeight = 73;
export const virtualOverscan = 8;

interface LiveVisitFilterOptions {
    visitTab: VisitTab;
    search: string;
    yearLevel: string;
    section: string;
}

export function initialVisitTab(visits: DashboardVisit[], mode: LiveVisitsTableMode): VisitTab {
    if (mode !== 'live') {
        return 'student';
    }

    return visits[0]?.visitor.type === 'employee' ? 'employee' : 'student';
}

export function liveVisitsTableTitle(mode: LiveVisitsTableMode, visitTab: VisitTab) {
    if (mode === 'history') {
        return visitTab === 'student' ? 'Student visit history' : 'Employee visit history';
    }

    return visitTab === 'student' ? 'Student visits today' : 'Employee visits today';
}

export function liveVisitsTableDescription(mode: LiveVisitsTableMode) {
    return mode === 'history' ? 'Visits from the active school year are shown newest first.' : 'Latest RFID scans for the selected tab are shown first.';
}

export function filterLiveVisits(visits: DashboardVisit[], { visitTab, search, yearLevel, section }: LiveVisitFilterOptions) {
    const normalizedSearch = search.trim().toLowerCase();

    return visits.filter((visit) => {
        const searchable = [
            visit.visitor.schoolId,
            visit.visitor.name,
            visit.visitor.type,
            visit.visitor.yearLevel,
            visit.visitor.section,
            visit.visitor.department,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return (
            visit.visitor.type === visitTab &&
            (visitTab !== 'student' || !yearLevel || visit.visitor.yearLevel === yearLevel) &&
            (visitTab !== 'student' || !section || visit.visitor.section === section) &&
            (!normalizedSearch || searchable.includes(normalizedSearch))
        );
    });
}

export function formatVisitTime(visit: DashboardVisit, mode: LiveVisitsTableMode) {
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
