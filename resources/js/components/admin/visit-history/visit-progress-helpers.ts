import type { VisitorWithRangeVisits } from './visit-logs-helpers';

export function progressPercent(visitor: VisitorWithRangeVisits, requiredVisits: number): number {
    if (requiredVisits <= 0) {
        return 0;
    }

    return Math.min(100, Math.round((visitor.rangeVisits.length / requiredVisits) * 100));
}
