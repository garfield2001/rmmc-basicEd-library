import { cn } from '@/lib/utils';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    id?: string;
    name?: string;
    disabled?: boolean;
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
const displayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function DateInput({ value, onChange, className, id, name, disabled = false }: DateInputProps) {
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const selectedDate = useMemo(() => parseIsoDate(value), [value]);
    const [isOpen, setIsOpen] = useState(false);
    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selectedDate ?? new Date()));
    const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

    useEffect(() => {
        if (selectedDate) {
            setVisibleMonth(startOfMonth(selectedDate));
        }
    }, [selectedDate]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);

        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, [isOpen]);

    const chooseDate = (date: Date) => {
        onChange(toIsoDate(date));
        setIsOpen(false);
    };

    return (
        <span ref={wrapperRef} className="relative block w-full">
            <button
                id={id}
                name={name}
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((open) => !open)}
                className={cn(
                    'flex h-10 w-full items-center justify-between rounded-lg border border-[#040DBF]/15 bg-white px-3 text-left text-sm text-[#010440] outline-none transition focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60',
                    className,
                )}
            >
                <span>{selectedDate ? displayFormatter.format(selectedDate) : 'Select date'}</span>
                <CalendarDays className="size-4 text-[#020659]/65" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-66 rounded-lg border border-[#040DBF]/15 bg-white p-4 text-[#010440] shadow-xl">
                    <div className="mb-3 grid grid-cols-[2rem_1fr_2rem] items-center">
                        <button
                            type="button"
                            onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                            className="inline-flex size-8 items-center justify-center rounded-md text-[#010440] hover:bg-[#f6f8ff]"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <div className="text-center text-sm font-semibold leading-5">
                            <div>{monthFormatter.format(visibleMonth)}</div>
                            <div>{visibleMonth.getFullYear()}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                            className="inline-flex size-8 items-center justify-center rounded-md text-[#010440] hover:bg-[#f6f8ff]"
                            aria-label="Next month"
                        >
                            <ChevronRight className="size-5" />
                        </button>
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

                            return (
                                <button
                                    key={toIsoDate(day)}
                                    type="button"
                                    onClick={() => chooseDate(day)}
                                    className={cn(
                                        'mx-auto flex size-8 items-center justify-center rounded-md font-medium transition',
                                        isCurrentMonth ? 'text-[#010440]' : 'text-[#020659]/45',
                                        isSelected ? 'bg-[#040DBF] text-white hover:bg-[#030A8C]' : 'hover:bg-[#f6f8ff]',
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

function parseIsoDate(value: string) {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarDays(month: Date) {
    const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());

    return Array.from({ length: 42 }, (_, index) => new Date(firstVisibleDay.getFullYear(), firstVisibleDay.getMonth(), firstVisibleDay.getDate() + index));
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
