import { DateInput, formatDisplayDate } from '@/components/ui/date-input';
import { cn } from '@/lib/utils';
import type { VisitTrafficRange, VisitTrendPoint } from '@/types/dashboard';

export const trafficRangeOptions: Record<VisitTrafficRange, { label: string; detail: string }> = {
    last7: {
        label: 'last 7 days',
        detail: 'Student and employee visits over the last 7 days',
    },
    last14: {
        label: 'last 14 days',
        detail: 'Student and employee visits over the last 14 days',
    },
    lastMonth: {
        label: 'last 30 days',
        detail: 'Student and employee visits over the last 30 days',
    },
    custom: {
        label: 'custom dates',
        detail: 'Student and employee visits in the selected dates',
    },
};

interface RangeControlsProps {
    value: VisitTrafficRange;
    startDate: string;
    endDate: string;
    minDate?: string;
    maxDate?: string;
    onRangeChange: (value: VisitTrafficRange) => void;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    onClearDates?: () => void;
    className?: string;
    compact?: boolean;
}

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

export function RangeControls({
    value,
    startDate,
    endDate,
    minDate,
    maxDate,
    onRangeChange,
    onStartDateChange,
    onEndDateChange,
    className,
    compact = false,
}: RangeControlsProps) {
    return (
        <div
            className={cn(
                compact
                    ? 'flex w-full min-w-0 flex-wrap items-center justify-between gap-2 min-[900px]:flex-nowrap'
                    : 'flex w-full min-w-0 flex-wrap items-center gap-2 min-[900px]:flex-nowrap',
                className,
            )}
        >
            <div className="admin-segmented-tabs shrink-0 flex-nowrap overflow-x-auto dark:border-slate-700 dark:bg-slate-800">
                {(['last7', 'last14', 'lastMonth'] as VisitTrafficRange[]).map((range) => (
                    <button
                        key={range}
                        type="button"
                        onClick={() => onRangeChange(range)}
                        className={`admin-segmented-tab rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                            value === range
                                ? 'admin-segmented-tab-active dark:bg-blue-600 dark:text-white'
                                : 'text-slate-700 hover:bg-white hover:text-[#010440] dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                        }`}
                    >
                        {trafficRangeOptions[range].label.replace('last ', '')}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => onRangeChange('custom')}
                    className={`admin-segmented-tab rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                        value === 'custom'
                            ? 'admin-segmented-tab-active dark:bg-blue-600 dark:text-white'
                            : 'text-slate-700 hover:bg-white hover:text-[#010440] dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                    }`}
                >
                    Custom
                </button>
            </div>
            {value === 'custom' && (
                <div className={cn('flex w-full min-w-0 flex-wrap gap-2 min-[900px]:ml-auto min-[900px]:w-auto min-[900px]:flex-nowrap')}>
                    <DateInput
                        value={startDate}
                        onChange={onStartDateChange}
                        min={minDate}
                        max={endDate || maxDate}
                        placeholder="Start date"
                        focusDate={startDate || minDate}
                        wrapperClassName="w-full min-[520px]:w-[11rem]"
                    />
                    <DateInput
                        value={endDate}
                        onChange={onEndDateChange}
                        min={startDate || minDate}
                        max={maxDate}
                        placeholder="End date"
                        focusDate={endDate || startDate || minDate}
                        wrapperClassName="w-full min-[520px]:w-[11rem]"
                    />
                </div>
            )}
        </div>
    );
}

export function rangeLabel(range: VisitTrafficRange, startDate: string, endDate: string) {
    return range === 'custom' ? summarizeDates(startDate, endDate) : trafficRangeOptions[range].label;
}

export function rangeDetail(range: VisitTrafficRange, startDate: string, endDate: string) {
    if (range === 'custom' && startDate) {
        return `Student and employee visits over the last ${daysInRange(startDate, endDate || todayIsoDate())} days`;
    }

    return range === 'custom' ? `Visits from ${summarizeDates(startDate, endDate)}` : trafficRangeOptions[range].detail;
}

export function visitsBetween(visits: VisitTrendPoint[], startDate: string, endDate: string) {
    return visits.filter((point) => (!startDate || (point.date ?? '') >= startDate) && (!endDate || (point.date ?? '') <= endDate));
}

export function relativeDateRange(range: VisitTrafficRange): [string, string] {
    const days = range === 'last7' ? 7 : range === 'last14' ? 14 : 30;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

function summarizeDates(startDate: string, endDate: string) {
    if (startDate && endDate) {
        return `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`;
    }

    if (startDate) {
        return `from ${formatDisplayDate(startDate)}`;
    }

    if (endDate) {
        return `until ${formatDisplayDate(endDate)}`;
    }

    return 'custom dates';
}

function daysInRange(startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        return 0;
    }

    return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}
