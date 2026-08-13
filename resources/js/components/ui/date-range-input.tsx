import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';
import { DateRangeCalendarPopover } from './date-range-calendar-popover';
import { displayFormatter } from './date-input-utils';
import { useDateRangeInputState } from './use-date-range-input-state';

interface DateRangeInputProps {
    startDate?: string;
    endDate?: string;
    onChange: (startDate: string, endDate: string) => void;
    className?: string;
    wrapperClassName?: string;
    id?: string;
    name?: string;
    disabled?: boolean;
    min?: string;
    max?: string;
    placeholder?: string;
}

export function DateRangeInput({
    startDate,
    endDate,
    onChange,
    className,
    wrapperClassName,
    id,
    name,
    disabled = false,
    min,
    max,
    placeholder = 'Select date range',
}: DateRangeInputProps) {
    const state = useDateRangeInputState({ 
        startDate: startDate ?? '', 
        endDate: endDate ?? '', 
        onChange, 
        min, 
        max 
    });

    const displayStart = state.parsedStart ? displayFormatter.format(state.parsedStart) : '';
    const displayEnd = state.parsedEnd ? displayFormatter.format(state.parsedEnd) : '';
    const displayValue = displayStart && displayEnd ? `${displayStart} - ${displayEnd}` : '';

    return (
        <span ref={state.wrapperRef} className={cn('relative block w-full', wrapperClassName)}>
            <button
                id={id}
                name={name}
                type="button"
                disabled={disabled}
                onClick={() => state.setIsOpen((open) => !open)}
                className={cn(
                    'flex h-10 w-full items-center justify-between rounded-lg border border-[#040DBF]/15 bg-white pr-3 pl-3 text-sm outline-none transition focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60',
                    displayValue ? 'text-[#010440]' : 'text-[#020659]/45',
                    className,
                )}
                aria-label={name ?? id ?? 'Date range'}
            >
                <span className="truncate">{displayValue || placeholder}</span>
                <CalendarDays className="ml-2 size-4 shrink-0 text-[#020659]/65" />
            </button>

            {state.isOpen && (
                <DateRangeCalendarPopover
                    visibleMonth={state.visibleMonth}
                    rangeStart={state.rangeStart}
                    rangeEnd={state.rangeEnd}
                    hoverDate={state.hoverDate}
                    minDate={state.minDate}
                    maxDate={state.maxDate}
                    calendarDays={state.calendarDays}
                    yearOptions={state.yearOptions}
                    onMonthChange={state.moveVisibleMonth}
                    onMonthWheel={state.scrollVisibleMonth}
                    onCalendarWheel={state.scrollCalendarMonth}
                    onDateChoose={state.chooseDate}
                    onDateHover={state.setHoverDate}
                    align={state.popoverAlign}
                />
            )}
        </span>
    );
}
