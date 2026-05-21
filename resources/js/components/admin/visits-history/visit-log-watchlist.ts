import type { VisitorWithRangeVisits } from './visit-history-helpers';

export function buildWatchlist(visitors: VisitorWithRangeVisits[], studentRequiredVisits: number, employeeRequiredVisits: number) {
    const students = visitors.filter((visitor) => visitor.type === 'student');
    const employees = visitors.filter((visitor) => visitor.type === 'employee');
    const attentionRows = [...students, ...employees]
        .map((visitor) => {
            const required = visitor.type === 'employee' ? employeeRequiredVisits : studentRequiredVisits;
            const visits = visitor.rangeVisits.length;

            return { visitor, required, visits, percent: required > 0 ? Math.min(100, Math.round((visits / required) * 100)) : 0 };
        })
        .filter((row) => row.required > 0 && row.visits < row.required)
        .sort((first, second) => first.percent - second.percent || first.visits - second.visits);

    return {
        yearLevels: groupedCounts(students, (visitor) => visitor.yearLevel || 'Unassigned'),
        sections: groupedCounts(students, (visitor) => [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'Unassigned'),
        departments: groupedCounts(employees, (visitor) => visitor.department || 'Unassigned'),
        attentionRows,
    };
}

export function watchlistGroupLabel(visitor: VisitorWithRangeVisits) {
    if (visitor.type === 'employee') {
        return visitor.department || 'No department';
    }

    return [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'No year level or section';
}

function groupedCounts(visitors: VisitorWithRangeVisits[], label: (visitor: VisitorWithRangeVisits) => string) {
    const groups = new Map<string, number>();

    visitors.forEach((visitor) => {
        groups.set(label(visitor), (groups.get(label(visitor)) ?? 0) + visitor.rangeVisits.length);
    });

    return [...groups.entries()].map(([label, value]) => ({ label, value })).sort((first, second) => first.value - second.value);
}
