import { parseVisitDate, toLocalIsoDate, type VisitorWithRangeVisits } from './visit-history-helpers';

export type WatchlistGroup = { kind: 'yearLevel' | 'section' | 'department'; label: string } | null;

export function buildWatchlist(visitors: VisitorWithRangeVisits[], studentRequiredVisits: number, employeeRequiredVisits: number) {
    const today = toLocalIsoDate(new Date());
    const rows = visitors
        .map((visitor) => {
            const required = visitor.type === 'employee' ? employeeRequiredVisits : studentRequiredVisits;
            const visits = visitor.rangeVisits.length;
            const percent = required > 0 ? Math.min(100, Math.round((visits / required) * 100)) : 0;
            const todayVisits = visitor.visits.filter(
                (visit) => toLocalIsoDate(parseVisitDate(visit.visitedAt) ?? new Date(0)) === today,
            ).length;

            return {
                visitor,
                required,
                visits,
                percent,
                todayVisits,
                remaining: Math.max(0, required - visits),
            };
        })
        .filter((row) => row.required > 0);
    const students = rows.filter((row) => row.visitor.type === 'student');
    const employees = rows.filter((row) => row.visitor.type === 'employee');
    const attentionRows = rows
        .filter((row) => row.required > 0 && row.visits < row.required)
        .sort((first, second) => first.percent - second.percent || second.remaining - first.remaining || first.visits - second.visits);

    return {
        today,
        rows,
        studentSummary: summarizeRows(students),
        employeeSummary: summarizeRows(employees),
        studentBuckets: progressBuckets(students),
        employeeBuckets: progressBuckets(employees),
        yearLevels: groupedProgress(students, (row) => row.visitor.yearLevel || 'Unassigned'),
        sections: groupedProgress(students, (row) => [row.visitor.yearLevel, row.visitor.section].filter(Boolean).join(' - ') || 'Unassigned'),
        departments: groupedProgress(employees, (row) => row.visitor.department || 'Unassigned'),
        attentionRows,
    };
}

export function watchlistGroupLabel(visitor: VisitorWithRangeVisits) {
    if (visitor.type === 'employee') {
        return visitor.department || 'No department';
    }

    return [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'No year level or section';
}

export function matchesWatchlistGroup(visitor: VisitorWithRangeVisits, group: WatchlistGroup) {
    if (!group) {
        return true;
    }

    if (group.kind === 'department') {
        return (visitor.department || 'Unassigned') === group.label;
    }

    if (group.kind === 'yearLevel') {
        return (visitor.yearLevel || 'Unassigned') === group.label;
    }

    return (
        [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') === group.label ||
        (!visitor.yearLevel && !visitor.section && group.label === 'Unassigned')
    );
}

function groupedProgress(rows: WatchlistRows, label: (row: WatchlistRows[number]) => string) {
    const groups = new Map<string, WatchlistRows>();

    rows.forEach((row) => {
        const key = label(row);
        groups.set(key, [...(groups.get(key) ?? []), row]);
    });

    return [...groups.entries()]
        .map(([label, groupRows]) => ({
            label,
            visitors: groupRows.length,
            visits: groupRows.reduce((sum, row) => sum + row.visits, 0),
            noVisits: groupRows.filter((row) => row.visits === 0).length,
            belowTarget: groupRows.filter((row) => row.visits < row.required).length,
            metTarget: groupRows.filter((row) => row.visits >= row.required).length,
            percent: Math.round(groupRows.reduce((sum, row) => sum + row.percent, 0) / Math.max(1, groupRows.length)),
        }))
        .sort((first, second) => first.percent - second.percent || second.noVisits - first.noVisits || first.label.localeCompare(second.label));
}

function summarizeRows(rows: WatchlistRows) {
    const requiredTotal = rows.reduce((sum, row) => sum + row.required, 0);
    const visits = rows.reduce((sum, row) => sum + row.visits, 0);

    return {
        visitors: rows.length,
        visits,
        requiredTotal,
        percent: requiredTotal > 0 ? Math.min(100, Math.round((visits / requiredTotal) * 100)) : 0,
        noVisits: rows.filter((row) => row.visits === 0).length,
        belowTarget: rows.filter((row) => row.visits < row.required).length,
        metTarget: rows.filter((row) => row.visits >= row.required).length,
        todayVisitors: rows.filter((row) => row.todayVisits > 0).length,
        todayVisits: rows.reduce((sum, row) => sum + row.todayVisits, 0),
    };
}

function progressBuckets(rows: WatchlistRows) {
    const buckets = [
        { label: 'No visits', value: 0 },
        { label: '1-25%', value: 0 },
        { label: '26-50%', value: 0 },
        { label: '51-99%', value: 0 },
        { label: 'Complete', value: 0 },
    ];

    rows.forEach((row) => {
        if (row.visits === 0) {
            buckets[0].value += 1;
            return;
        }

        if (row.percent <= 25) {
            buckets[1].value += 1;
            return;
        }

        if (row.percent <= 50) {
            buckets[2].value += 1;
            return;
        }

        if (row.percent < 100) {
            buckets[3].value += 1;
            return;
        }

        buckets[4].value += 1;
    });

    return buckets;
}

type WatchlistRows = Array<{
    visitor: VisitorWithRangeVisits;
    required: number;
    visits: number;
    percent: number;
    todayVisits: number;
    remaining: number;
}>;
