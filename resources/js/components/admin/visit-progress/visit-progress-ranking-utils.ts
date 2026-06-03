import { formatVisitDateTime, groupLabel, yearLevelOrder, type SortColumn, type SortDirection, type VisitorWithRangeVisits } from '../visit-logs/visit-logs-helpers';
import { progressPercent } from './visit-progress-helpers';

export function toProgressRow(visitor: VisitorWithRangeVisits, requiredVisits: number) {
    const visits = visitor.rangeVisits.length;

    return {
        visitor,
        visits,
        remaining: Math.max(0, requiredVisits - visits),
        percent: progressPercent(visitor, requiredVisits),
        lastVisit: formatVisitDateTime(visitor.rangeVisits[0]?.visitedAt),
    };
}

export type ProgressRow = ReturnType<typeof toProgressRow>;

export function compareProgressRows(first: ProgressRow, second: ProgressRow, column: SortColumn, direction: SortDirection) {
    const comparison = compareProgressValues(progressSortValue(first, column), progressSortValue(second, column));

    return direction === 'asc' ? comparison : comparison * -1;
}

function progressSortValue(row: ProgressRow, column: SortColumn) {
    if (column === 'schoolId') {
        return row.visitor.schoolId ?? '';
    }

    if (column === 'name') {
        return [row.visitor.lastName, row.visitor.firstName, row.visitor.name].filter(Boolean).join(' ');
    }

    if (column === 'group') {
        if (row.visitor.type === 'student') {
            const rank = yearLevelOrder.indexOf(row.visitor.yearLevel ?? '');
            return `${String(rank >= 0 ? rank : 99).padStart(2, '0')} ${row.visitor.section ?? ''}`;
        }
        return row.visitor.department ?? '';
    }

    if (column === 'visitCount') {
        return row.visits;
    }

    if (column === 'remaining') {
        return row.remaining;
    }

    if (column === 'progress') {
        return row.percent;
    }

    return row.visitor.rangeVisits[0]?.visitedAt ? new Date(row.visitor.rangeVisits[0].visitedAt).getTime() : 0;
}

function compareProgressValues(first: string | number, second: string | number) {
    if (typeof first === 'number' && typeof second === 'number') {
        return first - second;
    }

    return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' });
}
