import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';
import { DateCalendarPopover } from './date-calendar-popover';
import { formatDisplayDate } from './date-input-utils';
import { useDateInputState } from './use-date-input-state';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    id?: string;
    name?: string;
    disabled?: boolean;
    min?: string;
    max?: string;
    placeholder?: string;
    openOnFocus?: boolean;
    yearWindowStart?: number;
    yearWindowEnd?: number;
}

export { formatDisplayDate };

export function DateInput({
    value,
    onChange,
    className,
    id,
    name,
    disabled = false,
    min,
    max,
    placeholder = 'mm/dd/yyyy',
    openOnFocus = true,
    yearWindowStart,
    yearWindowEnd,
}: DateInputProps) {
    const dateInput = useDateInputState({ value, onChange, min, max, openOnFocus, yearWindowStart, yearWindowEnd });

    return (
        <span ref={dateInput.wrapperRef} className="relative block w-full">
            <span className="relative block">
                <input
                    id={id}
                    name={name}
                    type="text"
                    disabled={disabled}
                    inputMode="text"
                    placeholder={placeholder}
                    value={dateInput.inputValue}
                    onFocus={(event) => {
                        dateInput.beginEditing();
                        event.currentTarget.select();
                    }}
                    onChange={(event) => dateInput.updateDraft(event.target.value)}
                    onBlur={(event) => {
                        if (dateInput.wrapperRef.current?.contains(event.relatedTarget as Node | null)) {
                            return;
                        }

                        dateInput.commitDraft();
                        dateInput.setIsOpen(false);
                    }}
                    className={cn(
                        'h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-12 pl-3 text-sm text-[#010440] outline-none transition placeholder:text-[#020659]/45 focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60',
                        className,
                    )}
                    aria-label={name ?? id ?? 'Date'}
                />
                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => dateInput.setIsOpen((open) => !open)}
                    className="absolute top-1/2 right-2.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#020659]/65 hover:bg-[#f6f8ff] disabled:cursor-not-allowed"
                    aria-label="Open calendar"
                >
                    <CalendarDays className="size-4" />
                </button>
            </span>

            {dateInput.isOpen && (
                <DateCalendarPopover
                    visibleMonth={dateInput.visibleMonth}
                    selectedDate={dateInput.selectedDate}
                    minDate={dateInput.minDate}
                    maxDate={dateInput.maxDate}
                    calendarDays={dateInput.calendarDays}
                    yearOptions={dateInput.yearOptions}
                    onMonthChange={dateInput.moveVisibleMonth}
                    onMonthWheel={dateInput.scrollVisibleMonth}
                    onDateChoose={dateInput.chooseDate}
                />
            )}
        </span>
    );
}
