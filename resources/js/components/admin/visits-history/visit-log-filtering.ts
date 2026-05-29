import type { VisitHistoryVisitor } from '@/types/dashboard';
import { visitsInDateRange, type VisitLogStatusFilter, type VisitorTypeFilter, type VisitorWithRangeVisits } from './visit-history-helpers';

interface VisitLogFilterState {
    visitorType: VisitorTypeFilter;
    yearLevel: string;
    section: string;
    department: string;
    search: string;
}

export function visitorsWithDateCoverage(
    visitors: VisitHistoryVisitor[],
    startDate: string,
    endDate: string,
    today: string,
): VisitorWithRangeVisits[] {
    return visitors.map((visitor) => ({
        ...visitor,
        rangeVisits: visitsInDateRange(visitor.visits, startDate, endDate || today),
    }));
}

export function filterVisitLogVisitors(visitors: VisitorWithRangeVisits[], filters: VisitLogFilterState): VisitorWithRangeVisits[] {
    return filterVisitors(visitors, filters).filter((visitor) => visitor.rangeVisits.length > 0);
}

export function filterVisitLogStatus(visitors: VisitorWithRangeVisits[], status: VisitLogStatusFilter, requiredVisits: number): VisitorWithRangeVisits[] {
    if (status === 'all' || requiredVisits <= 0) {
        return visitors;
    }

    return visitors.filter((visitor) => {
        const visits = visitor.rangeVisits.length;

        if (status === 'below') {
            return visits > 0 && visits < requiredVisits;
        }

        if (status === 'met') {
            return visits >= requiredVisits;
        }

        return visits > requiredVisits;
    });
}

export function filterVisitProgressVisitors(visitors: VisitorWithRangeVisits[], filters: VisitLogFilterState): VisitorWithRangeVisits[] {
    return filterVisitors(visitors, filters);
}

function filterVisitors(visitors: VisitorWithRangeVisits[], filters: VisitLogFilterState): VisitorWithRangeVisits[] {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return visitors.filter((visitor) => {
        const searchable = [visitor.schoolId, visitor.name, visitor.yearLevel, visitor.section, visitor.department]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return (
            visitor.type === filters.visitorType &&
            (filters.visitorType !== 'student' || !filters.yearLevel || visitor.yearLevel === filters.yearLevel) &&
            (filters.visitorType !== 'student' || !filters.section || visitor.section === filters.section) &&
            (filters.visitorType !== 'employee' || !filters.department || visitor.department === filters.department) &&
            (!normalizedSearch || searchable.includes(normalizedSearch))
        );
    });
}

export function countVisitLogRangeVisits(visitors: VisitorWithRangeVisits[]) {
    const studentVisits = countVisitsByType(visitors, 'student');
    const employeeVisits = countVisitsByType(visitors, 'employee');
    const studentVisitors = countVisitorsByType(visitors, 'student');
    const employeeVisitors = countVisitorsByType(visitors, 'employee');
    const activeStudentVisitors = countVisitorsWithVisitsByType(visitors, 'student');
    const activeEmployeeVisitors = countVisitorsWithVisitsByType(visitors, 'employee');

    return {
        visits: studentVisits + employeeVisits,
        studentVisits,
        employeeVisits,
        studentVisitors,
        employeeVisitors,
        activeStudentVisitors,
        activeEmployeeVisitors,
    };
}

function countVisitsByType(visitors: VisitorWithRangeVisits[], type: 'student' | 'employee') {
    return visitors.filter((visitor) => visitor.type === type).reduce((sum, visitor) => sum + visitor.rangeVisits.length, 0);
}

function countVisitorsByType(visitors: VisitorWithRangeVisits[], type: 'student' | 'employee') {
    return visitors.filter((visitor) => visitor.type === type).length;
}

function countVisitorsWithVisitsByType(visitors: VisitorWithRangeVisits[], type: 'student' | 'employee') {
    return visitors.filter((visitor) => visitor.type === type && visitor.rangeVisits.length > 0).length;
}
