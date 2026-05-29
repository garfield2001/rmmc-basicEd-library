import type { VisitorWithRangeVisits } from '../visits-history/visit-history-helpers';

export function matchesDrilldownSearch(visitor: VisitorWithRangeVisits, search: string) {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
        return true;
    }

    return [visitor.schoolId, visitor.name, visitor.yearLevel, visitor.section, visitor.department]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
}
