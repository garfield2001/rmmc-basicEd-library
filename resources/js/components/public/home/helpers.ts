import { fallback } from './constants';

export function formatManilaDateTime(date: Date): string {
    return date.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

export function getScanErrorSummary(error?: string): string {
    const normalizedError = error?.toLowerCase();

    if (normalizedError?.includes('no active member matches')) {
        return 'ID not found';
    }

    if (normalizedError?.includes('multiple active members')) {
        return 'Multiple matches';
    }

    if (normalizedError?.includes('no active school year')) {
        return 'No school year';
    }

    return 'Unable to record';
}

export function getRestrictedRescanDetails(error?: string) {
    const details = error?.match(/scanned at (.+?)\.\s*A new visit can be recorded after (.+?) because/i);

    return {
        recentScanTime: details?.[1] ?? fallback,
        allowedRescanTime: details?.[2] ?? fallback,
    };
}
