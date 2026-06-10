import type { VisitorWithRangeVisits } from '../visit-logs/visit-logs-helpers';

type ProgressBucketKey = 'none' | 'low' | 'mid' | 'near' | 'complete';
export type ProgressStatusFilter = 'all' | 'in-progress' | 'complete' | 'no-visits';

interface ProgressBucketDefinition {
    key: ProgressBucketKey;
    label: string;
    value: number;
}

export const progressBucketDefinitions: Array<Omit<ProgressBucketDefinition, 'value'>> = [
    { key: 'none', label: 'No visits' },
    { key: 'low', label: '1-25%' },
    { key: 'mid', label: '26-50%' },
    { key: 'near', label: '51-99%' },
    { key: 'complete', label: 'Complete' },
];

export function progressPercent(visitor: VisitorWithRangeVisits, requiredVisits: number) {
    if (requiredVisits <= 0) {
        return 0;
    }

    return Math.min(100, Math.round((visitor.rangeVisits.length / requiredVisits) * 100));
}

export function progressBucketForVisitor(visitor: VisitorWithRangeVisits, requiredVisits: number): ProgressBucketKey {
    const visits = visitor.rangeVisits.length;
    const percent = progressPercent(visitor, requiredVisits);

    if (visits === 0) {
        return 'none';
    }

    if (percent <= 25) {
        return 'low';
    }

    if (percent <= 50) {
        return 'mid';
    }

    if (percent < 100) {
        return 'near';
    }

    return 'complete';
}

export function matchesProgressStatus(visitor: VisitorWithRangeVisits, requiredVisits: number, status: ProgressStatusFilter) {
    if (status === 'all') {
        return true;
    }

    if (status === 'no-visits') {
        return visitor.rangeVisits.length === 0;
    }

    const visits = visitor.rangeVisits.length;
    const complete = requiredVisits > 0 && visits >= requiredVisits;

    return status === 'complete' ? complete : visits > 0 && !complete;
}
