import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
const displayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const monthOptions = Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: monthFormatter.format(new Date(2026, month, 1)),
}));

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
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const selectedDate = useMemo(() => parseIsoDate(value), [value]);
    const minDate = useMemo(() => parseIsoDate(min), [min]);
    const maxDate = useMemo(() => parseIsoDate(max), [max]);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [draftValue, setDraftValue] = useState('');
    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(clampDate(selectedDate ?? minDate ?? new Date(), minDate, maxDate)));
    const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
    const yearOptions = useMemo(
        () => buildYearOptions(minDate, maxDate, visibleMonth, yearWindowStart, yearWindowEnd),
        [maxDate, minDate, visibleMonth, yearWindowEnd, yearWindowStart],
    );

    useEffect(() => {
        setVisibleMonth(startOfMonth(clampDate(selectedDate ?? minDate ?? new Date(), minDate, maxDate)));
    }, [maxDate, minDate, selectedDate]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (wrapperRef.current?.contains(event.target as Node)) {
                return;
            }

            commitDraft();
            setIsOpen(false);
        };

        document.addEventListener('mousedown', closeOnOutsideClick);

        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    });

    const inputValue = isEditing ? draftValue : selectedDate ? displayFormatter.format(selectedDate) : '';

    const chooseDate = (date: Date) => {
        if (!isDateInRange(date, minDate, maxDate)) {
            return;
        }

        onChange(toIsoDate(date));
        setDraftValue(formatTypedDate(date));
        setIsEditing(false);
        setIsOpen(false);
    };

    const commitDraft = () => {
        if (!isEditing) {
            return;
        }

        const parsedDate = parseTypedDate(draftValue);

        if (parsedDate) {
            onChange(toIsoDate(clampDate(parsedDate, minDate, maxDate)));
        }

        setIsEditing(false);
    };

    const moveVisibleMonth = (month: number, year: number) => {
        const nextMonth = startOfMonth(clampDate(new Date(year, month, 1), monthStartLimit(minDate), monthStartLimit(maxDate)));

        setVisibleMonth(nextMonth);
    };

    return (
        <span ref={wrapperRef} className="relative block w-full">
            <span className="relative block">
                <input
                    id={id}
                    name={name}
                    type="text"
                    disabled={disabled}
                    inputMode="numeric"
                    placeholder={placeholder}
                    value={inputValue}
                    onFocus={(event) => {
                        setIsEditing(true);
                        setDraftValue(selectedDate ? formatTypedDate(selectedDate) : '');
                        setIsOpen(openOnFocus);
                        event.currentTarget.select();
                    }}
                    onChange={(event) => setDraftValue(event.target.value)}
                    onBlur={(event) => {
                        if (wrapperRef.current?.contains(event.relatedTarget as Node | null)) {
                            return;
                        }

                        commitDraft();
                        setIsOpen(false);
                    }}
                    className={cn(
                        'h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-10 pl-3 text-sm text-[#010440] outline-none transition placeholder:text-[#020659]/45 focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60',
                        className,
                    )}
                    aria-label={name ?? id ?? 'Date'}
                />
                <button
                    type="button"
                    disabled={disabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setIsOpen((open) => !open)}
                    className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#020659]/65 hover:bg-[#f6f8ff] disabled:cursor-not-allowed"
                    aria-label="Open calendar"
                >
                    <CalendarDays className="size-4" />
                </button>
            </span>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-72 rounded-lg border border-[#040DBF]/15 bg-white p-4 text-[#010440] shadow-xl">
                    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
                        <select
                            value={visibleMonth.getMonth()}
                            onChange={(event) => moveVisibleMonth(Number(event.target.value), visibleMonth.getFullYear())}
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
                            onChange={(event) => moveVisibleMonth(visibleMonth.getMonth(), Number(event.target.value))}
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

                            return (
                                <button
                                    key={toIsoDate(day)}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => chooseDate(day)}
                                    className={cn(
                                        'mx-auto flex size-8 items-center justify-center rounded-md font-medium transition disabled:cursor-not-allowed disabled:text-[#020659]/25',
                                        isCurrentMonth ? 'text-[#010440]' : 'text-[#020659]/45',
                                        isSelected ? 'bg-[#040DBF] text-white hover:bg-[#030A8C] disabled:bg-[#040DBF]/45' : 'hover:bg-[#f6f8ff]',
                                    )}
                                >
                                    {String(day.getDate()).padStart(2, '0')}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </span>
    );
}

export function formatDisplayDate(value: string) {
    const date = parseIsoDate(value);

    return date ? displayFormatter.format(date) : value;
}

function parseIsoDate(value?: string) {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return validDate(year, month, day);
}

function parseTypedDate(value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const isoDate = parseIsoDate(trimmedValue);

    if (isoDate) {
        return isoDate;
    }

    const match = trimmedValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

    if (!match) {
        return null;
    }

    return validDate(Number(match[3]), Number(match[1]), Number(match[2]));
}

function validDate(year: number, month: number, day: number) {
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return date;
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthStartLimit(date: Date | null) {
    return date ? startOfMonth(date) : null;
}

function buildCalendarDays(month: Date) {
    const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());

    return Array.from({ length: 42 }, (_, index) => new Date(firstVisibleDay.getFullYear(), firstVisibleDay.getMonth(), firstVisibleDay.getDate() + index));
}

function buildYearOptions(minDate: Date | null, maxDate: Date | null, visibleMonth: Date, yearWindowStart?: number, yearWindowEnd?: number) {
    const firstYear = yearWindowStart ?? minDate?.getFullYear() ?? visibleMonth.getFullYear() - 10;
    const lastYear = yearWindowEnd ?? maxDate?.getFullYear() ?? visibleMonth.getFullYear() + 10;

    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
}

function formatTypedDate(date: Date) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

function isDateInRange(date: Date, minDate: Date | null, maxDate: Date | null) {
    const candidate = startOfDay(date);

    if (minDate && candidate < startOfDay(minDate)) {
        return false;
    }

    if (maxDate && candidate > startOfDay(maxDate)) {
        return false;
    }

    return true;
}

function isMonthInRange(month: number, year: number, minDate: Date | null, maxDate: Date | null) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    if (minDate && monthEnd < startOfMonth(minDate)) {
        return false;
    }

    if (maxDate && monthStart > startOfMonth(maxDate)) {
        return false;
    }

    return true;
}

function clampDate(date: Date, minDate: Date | null, maxDate: Date | null) {
    if (minDate && date < minDate) {
        return new Date(minDate);
    }

    if (maxDate && date > maxDate) {
        return new Date(maxDate);
    }

    return new Date(date);
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(first: Date, second: Date) {
    return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

function toIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
