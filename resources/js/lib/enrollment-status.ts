import type { EnrollmentStatus } from '@/types/enrollments';

export function enrollmentStatusLabel(status: EnrollmentStatus | string | null | undefined) {
    const labels: Record<string, string> = {
        enrolled: 'Enrolled',
        pending: 'Pending review',
        retained: 'Retained',
        not_enrolled: 'Not enrolled',
        stopped: 'Stopped',
        transferred: 'Transferred',
        graduated: 'Graduated',
    };

    return status ? (labels[status] ?? status) : 'Not enrolled';
}

export function enrollmentStatusTone(status: EnrollmentStatus | string | null | undefined) {
    if (status === 'enrolled') {
        return 'bg-emerald-50 text-emerald-700';
    }

    if (status === 'pending') {
        return 'bg-amber-50 text-amber-700';
    }

    if (status === 'retained') {
        return 'bg-blue-50 text-blue-700';
    }

    if (status === 'graduated') {
        return 'bg-violet-50 text-violet-700';
    }

    if (status === 'not_enrolled' || status === 'stopped' || status === 'transferred') {
        return 'bg-red-50 text-red-700';
    }

    return 'bg-[#f6f8ff] text-[#030A8C]';
}
