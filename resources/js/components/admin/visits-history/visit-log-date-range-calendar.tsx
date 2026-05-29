import {
    buildCalendarDays,
    buildYearOptions,
    clampDate,
    isDateInRange,
    isMonthInRange,
    isSameDay,
    monthOptions,
    parseIsoDate,
    toIsoDate,
} from '@/components/ui/date-input-utils';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';

interface VisitLogDateRangeCalendarProps {
    activePoint: 'start' | 'end';
    visibleMonth: Date;
    startDate: string;
    endDate: string;
    minDate: string;
    maxDate: string;
    onActivePointChange: (value: 'start' | 'end') => void;
    onVisibleMonthChange: (value: Date) => void;
    onDateChoose: (date: Date) => void;
}

export function VisitLogDateRangeCalendar({
    activePoint,
    visibleMonth,
    startDate,
    endDate,
    minDate,
    maxDate,
    onActivePointChange,
    onVisibleMonthChange,
    onDateChoose,
}: VisitLogDateRangeCalendarProps) {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    const min = parseIsoDate(minDate);
    const max = parseIsoDate(maxDate);
    const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
    const years = useMemo(() => buildYearOptions(min, max, visibleMonth), [max, min, visibleMonth]);

    const changeVisibleMonth = (month: Date) => {
        onVisibleMonthChange(clampDate(month, min, max));
    };
    const handleWheel = (event: React.WheelEvent<HTMLDivElement | HTMLSelectElement>) => {
        event.preventDefault();
        event.stopPropagation();
        changeVisibleMonth(moveMonth(visibleMonth, event.deltaY > 0 ? 1 : -1));
    };

    return (
        <div onWheel={handleWheel} className="admin-contained-scroll rounded-lg border border-[#040DBF]/10 bg-white p-3 shadow-xl">
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
                <PointButton active={activePoint === 'start'} label="Choose from date" onClick={() => onActivePointChange('start')} />
                <PointButton active={activePoint === 'end'} label="Choose to date" onClick={() => onActivePointChange('end')} />
            </div>
            <div className="mb-3 grid grid-cols-[2rem_minmax(0,1fr)_5.5rem_2rem] gap-2">
                <MonthButton
                    direction="left"
                    disabled={!isMonthInRange(visibleMonth.getMonth() - 1, visibleMonth.getFullYear(), min, max)}
                    onClick={() => changeVisibleMonth(moveMonth(visibleMonth, -1))}
                />
                <select
                    value={visibleMonth.getMonth()}
                    onChange={(event) => changeVisibleMonth(new Date(visibleMonth.getFullYear(), Number(event.target.value), 1))}
                    onWheel={handleWheel}
                    className="h-9 rounded-md border border-[#040DBF]/15 bg-white px-2 text-sm font-medium outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                >
                    {monthOptions.map((month) => (
                        <option key={month.value} value={month.value} disabled={!isMonthInRange(month.value, visibleMonth.getFullYear(), min, max)}>
                            {month.label}
                        </option>
                    ))}
                </select>
                <select
                    value={visibleMonth.getFullYear()}
                    onChange={(event) => changeVisibleMonth(new Date(Number(event.target.value), visibleMonth.getMonth(), 1))}
                    onWheel={handleWheel}
                    className="h-9 rounded-md border border-[#040DBF]/15 bg-white px-2 text-sm font-medium outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                >
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
                <MonthButton
                    direction="right"
                    disabled={!isMonthInRange(visibleMonth.getMonth() + 1, visibleMonth.getFullYear(), min, max)}
                    onClick={() => changeVisibleMonth(moveMonth(visibleMonth, 1))}
                />
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="py-1 text-xs font-semibold text-[#020659]/70">
                        {day}
                    </div>
                ))}
                {days.map((day) => (
                    <CalendarDay
                        key={toIsoDate(day)}
                        day={day}
                        visibleMonth={visibleMonth}
                        start={start}
                        end={end}
                        min={min}
                        max={max}
                        onChoose={onDateChoose}
                    />
                ))}
            </div>
        </div>
    );
}

function PointButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-md border px-3 py-2 text-sm font-semibold transition',
                active ? 'border-[#040DBF] bg-[#f6f8ff] text-[#010440]' : 'border-[#040DBF]/10 text-[#020659]/70 hover:bg-[#f6f8ff]',
            )}
        >
            {label}
        </button>
    );
}

function MonthButton({ direction, disabled, onClick }: { direction: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
    const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            aria-label={`${direction} month`}
            disabled={disabled}
            onClick={onClick}
            className="inline-flex h-9 items-center justify-center rounded-md border border-[#040DBF]/15 bg-white text-[#020659] hover:bg-[#f6f8ff] disabled:cursor-not-allowed disabled:opacity-45"
        >
            <Icon className="size-4" />
        </button>
    );
}

function CalendarDay({
    day,
    visibleMonth,
    start,
    end,
    min,
    max,
    onChoose,
}: {
    day: Date;
    visibleMonth: Date;
    start: Date | null;
    end: Date | null;
    min: Date | null;
    max: Date | null;
    onChoose: (date: Date) => void;
}) {
    const disabled = !isDateInRange(day, min, max);
    const inMonth = day.getMonth() === visibleMonth.getMonth();
    const selected = Boolean((start && isSameDay(day, start)) || (end && isSameDay(day, end)));
    const inRange = Boolean(start && end && day >= start && day <= end);

    if (!inMonth) {
        return <span aria-hidden="true" />;
    }

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChoose(day)}
            className={cn(
                'mx-auto flex size-8 items-center justify-center rounded-md font-medium transition disabled:cursor-not-allowed disabled:text-[#020659]/25',
                inRange && 'bg-[#040DBF]/10 text-[#030A8C]',
                selected && 'bg-[#040DBF] text-white hover:bg-[#030A8C]',
                !selected && !inRange && 'hover:bg-[#f6f8ff]',
            )}
        >
            {String(day.getDate()).padStart(2, '0')}
        </button>
    );
}

function moveMonth(visibleMonth: Date, offset: number) {
    return new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
}
