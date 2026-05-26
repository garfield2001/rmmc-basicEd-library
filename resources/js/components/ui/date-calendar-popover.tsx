import { cn } from '@/lib/utils';
import type { WheelEvent } from 'react';
import { isDateInRange, isMonthInRange, isSameDay, monthOptions, toIsoDate } from './date-input-utils';

interface DateCalendarPopoverProps {
    visibleMonth: Date;
    selectedDate: Date | null;
    minDate: Date | null;
    maxDate: Date | null;
    calendarDays: Date[];
    yearOptions: number[];
    onMonthChange: (month: number, year: number) => void;
    onMonthWheel: (event: WheelEvent<HTMLSelectElement>) => void;
    onCalendarWheel: (event: WheelEvent<HTMLDivElement>) => void;
    onDateChoose: (date: Date) => void;
    align?: 'left' | 'right';
}

export function DateCalendarPopover({
    visibleMonth,
    selectedDate,
    minDate,
    maxDate,
    calendarDays,
    yearOptions,
    onMonthChange,
    onMonthWheel,
    onCalendarWheel,
    onDateChoose,
    align = 'left',
}: DateCalendarPopoverProps) {
    return (
        <div
            onWheel={onCalendarWheel}
            className={cn(
                'absolute z-50 mt-2 w-72 rounded-lg border border-[#040DBF]/15 bg-white p-4 text-[#010440] shadow-xl',
                align === 'right' ? 'right-0' : 'left-0',
            )}
        >
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
                <select
                    value={visibleMonth.getMonth()}
                    onChange={(event) => onMonthChange(Number(event.target.value), visibleMonth.getFullYear())}
                    onWheel={onMonthWheel}
                    className="h-9 rounded-md border border-[#040DBF]/15 bg-white px-2 text-sm font-medium outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                >
                    {monthOptions.map((month) => (
                        <option key={month.value} value={month.value} disabled={!isMonthInRange(month.value, visibleMonth.getFullYear(), minDate, maxDate)}>
                            {month.label}
                        </option>
                    ))}
                </select>
                <select
                    value={visibleMonth.getFullYear()}
                    onChange={(event) => onMonthChange(visibleMonth.getMonth(), Number(event.target.value))}
                    onWheel={onMonthWheel}
                    className="h-9 rounded-md border border-[#040DBF]/15 bg-white px-2 text-sm font-medium outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                >
                    {yearOptions.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="py-1 font-semibold">
                        {day}
                    </div>
                ))}
                {calendarDays.map((day) => {
                    const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isDisabled = !isDateInRange(day, minDate, maxDate);

                    if (!isCurrentMonth) {
                        return <span key={toIsoDate(day)} className="mx-auto size-8" aria-hidden="true" />;
                    }

                    return (
                        <button
                            key={toIsoDate(day)}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => onDateChoose(day)}
                            className={cn(
                                'mx-auto flex size-8 items-center justify-center rounded-md font-medium transition disabled:cursor-not-allowed disabled:text-[#020659]/25',
                                'text-[#010440]',
                                isSelected ? 'bg-[#040DBF] text-white hover:bg-[#030A8C] disabled:bg-[#040DBF]/45' : 'hover:bg-[#f6f8ff]',
                            )}
                        >
                            {String(day.getDate()).padStart(2, '0')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
