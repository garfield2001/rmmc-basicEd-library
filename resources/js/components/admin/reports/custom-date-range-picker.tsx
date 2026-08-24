import { Button } from '@/components/ui/button';
import {
    buildCalendarDays,
    buildYearOptions,
    clampDate,
    formatDisplayDate,
    isDateInRange,
    isMonthInRange,
    isSameDay,
    monthOptions,
    monthStartLimit,
    parseIsoDate,
    startOfMonth,
    toIsoDate,
} from '@/components/ui/date-input-utils';
import { cn } from '@/lib/utils';
import { CalendarDays, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface CustomDateRangePickerProps {
    startDate: string;
    endDate: string;
    min: string;
    max: string;
    onChange: (startDate: string, endDate: string) => void;
}

export function CustomDateRangePicker({ startDate, endDate, min, max, onChange }: CustomDateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [draftStart, setDraftStart] = useState<Date | null>(() => parseIsoDate(startDate));
    const [draftEnd, setDraftEnd] = useState<Date | null>(() => parseIsoDate(endDate));
    const [popoverAlign, setPopoverAlign] = useState<'left' | 'right'>('left');
    const [popoverPlacement, setPopoverPlacement] = useState<'bottom' | 'top'>('bottom');
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const minDate = useMemo(() => parseIsoDate(min), [min]);
    const maxDate = useMemo(() => parseIsoDate(max), [max]);

    const initialMonth = useMemo(() => {
        const preferred = parseIsoDate(startDate) ?? parseIsoDate(min) ?? new Date();
        return startOfMonth(clampDate(preferred, minDate, maxDate));
    }, [startDate, min, minDate, maxDate]);

    const [visibleMonth, setVisibleMonth] = useState<Date>(initialMonth);

    useEffect(() => {
        setDraftStart(parseIsoDate(startDate));
        setDraftEnd(parseIsoDate(endDate));
        if (startDate) {
            const parsed = parseIsoDate(startDate);
            if (parsed) setVisibleMonth(startOfMonth(clampDate(parsed, minDate, maxDate)));
        }
    }, [startDate, endDate, minDate, maxDate]);

    useEffect(() => {
        if (!isOpen) return;

        const updateAlignment = () => {
            const rect = wrapperRef.current?.getBoundingClientRect();
            if (!rect) return;
            setPopoverAlign(rect.left + 300 > window.innerWidth - 16 ? 'right' : 'left');
            if (rect.bottom + 340 > window.innerHeight && rect.top > 350) {
                setPopoverPlacement('top');
            } else {
                setPopoverPlacement('bottom');
            }
        };

        updateAlignment();
        window.addEventListener('resize', updateAlignment);
        window.addEventListener('scroll', updateAlignment, true);

        return () => {
            window.removeEventListener('resize', updateAlignment);
            window.removeEventListener('scroll', updateAlignment, true);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const el = popoverRef.current;
        if (!el) return;

        const handleWheel = (event: globalThis.WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const delta = event.deltaY > 0 ? 1 : -1;
            setVisibleMonth((current) =>
                startOfMonth(
                    clampDate(new Date(current.getFullYear(), current.getMonth() + delta, 1), monthStartLimit(minDate), monthStartLimit(maxDate)),
                ),
            );
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, [isOpen, minDate, maxDate]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setDraftStart(parseIsoDate(startDate));
                setDraftEnd(parseIsoDate(endDate));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, startDate, endDate]);

    const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
    const yearOptions = useMemo(() => buildYearOptions(minDate, maxDate, visibleMonth), [minDate, maxDate, visibleMonth]);

    const moveVisibleMonth = (month: number, year: number) => {
        const nextMonth = startOfMonth(clampDate(new Date(year, month, 1), monthStartLimit(minDate), monthStartLimit(maxDate)));
        setVisibleMonth(nextMonth);
    };

    const handleDateClick = (day: Date) => {
        if (!draftStart || (draftStart && draftEnd)) {
            setDraftStart(day);
            setDraftEnd(null);
        } else {
            let finalStart = draftStart;
            let finalEnd = day;

            if (day < draftStart) {
                finalStart = day;
                finalEnd = draftStart;
            }

            setDraftStart(finalStart);
            setDraftEnd(finalEnd);
            onChange(toIsoDate(finalStart), toIsoDate(finalEnd));
            setIsOpen(false);
        }
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDraftStart(null);
        setDraftEnd(null);
        onChange('', '');
    };

    const displayLabel = useMemo(() => {
        if (startDate && endDate) {
            return `${formatDisplayDate(startDate)} — ${formatDisplayDate(endDate)}`;
        }
        if (startDate) {
            return `${formatDisplayDate(startDate)} — Select end date`;
        }
        return 'Select start and end date';
    }, [startDate, endDate]);

    return (
        <div ref={wrapperRef} className="relative block w-full">
            {/* Combined Input Trigger */}
            <div
                onClick={() => setIsOpen((prev) => !prev)}
                className={cn(
                    'flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm transition outline-none',
                    isOpen ? 'border-[#040DBF] ring-4 ring-[#040DBF]/10' : 'hover:border-[#040DBF]/30',
                )}
            >
                <span className={cn('truncate font-medium', startDate && endDate ? 'text-[#010440]' : 'text-[#020659]/50')}>{displayLabel}</span>

                <div className="flex shrink-0 items-center gap-1.5 text-[#020659]/60">
                    {(startDate || endDate) && (
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="rounded p-1 hover:bg-[#f6f8ff] hover:text-[#010440]"
                            title="Clear date range"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                    <CalendarDays className="size-4 text-[#040DBF]" />
                </div>
            </div>

            {/* Float Popover with Non-Passive Wheel Interception */}
            {isOpen && (
                <div
                    ref={popoverRef}
                    className={cn(
                        'absolute z-50 w-76 rounded-xl border border-[#040DBF]/15 bg-white p-3.5 text-[#010440] shadow-2xl',
                        popoverPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
                        popoverAlign === 'right' ? 'right-0' : 'left-0',
                    )}
                >
                    {/* Header: Month and Year Selects */}
                    <div className="mb-2.5 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
                        <select
                            value={visibleMonth.getMonth()}
                            onChange={(event) => moveVisibleMonth(Number(event.target.value), visibleMonth.getFullYear())}
                            className="h-8 rounded-md border border-[#040DBF]/15 bg-white px-2 text-xs font-semibold outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                        >
                            {monthOptions.map((month) => (
                                <option
                                    key={month.value}
                                    value={month.value}
                                    disabled={!isMonthInRange(month.value, visibleMonth.getFullYear(), minDate, maxDate)}
                                >
                                    {month.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={visibleMonth.getFullYear()}
                            onChange={(event) => moveVisibleMonth(visibleMonth.getMonth(), Number(event.target.value))}
                            className="h-8 rounded-md border border-[#040DBF]/15 bg-white px-2 text-xs font-semibold outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Instruction Hint */}
                    <div className="mb-2 rounded-md bg-[#f6f8ff] px-2 py-1 text-center text-[11px] font-semibold text-[#030A8C]">
                        {!draftStart ? 'Select start date' : draftStart && !draftEnd ? 'Select end date' : 'Range selected • Click to re-pick'}
                    </div>

                    {/* Days Header */}
                    <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold text-[#020659]/70">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="py-0.5">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 text-center text-xs">
                        {calendarDays.map((day) => {
                            const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                            const isDisabled = !isDateInRange(day, minDate, maxDate);
                            const isStart = draftStart ? isSameDay(day, draftStart) : false;
                            const isEnd = draftEnd ? isSameDay(day, draftEnd) : false;

                            const isInRange = draftStart && draftEnd && day > draftStart && day < draftEnd;
                            const isInHoverRange =
                                draftStart &&
                                !draftEnd &&
                                hoverDate &&
                                ((hoverDate > draftStart && day > draftStart && day <= hoverDate) ||
                                    (hoverDate < draftStart && day < draftStart && day >= hoverDate));

                            if (!isCurrentMonth) {
                                return <span key={toIsoDate(day)} className="h-7.5" aria-hidden="true" />;
                            }

                            return (
                                <button
                                    key={toIsoDate(day)}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => handleDateClick(day)}
                                    onMouseEnter={() => setHoverDate(day)}
                                    onMouseLeave={() => setHoverDate(null)}
                                    className={cn(
                                        'relative flex h-7.5 w-full items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:text-[#020659]/25',
                                        isStart || isEnd
                                            ? 'bg-[#040DBF] font-bold text-white'
                                            : isInRange || isInHoverRange
                                              ? 'bg-[#040DBF]/10 text-[#010440]'
                                              : 'text-[#010440] hover:bg-[#f6f8ff]',
                                        isStart && (draftEnd || (hoverDate && hoverDate > draftStart)) && 'rounded-l-md',
                                        isEnd && draftStart && 'rounded-r-md',
                                        isStart && !draftEnd && !hoverDate && 'rounded-md',
                                        isStart && isEnd && 'rounded-md',
                                    )}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-2.5 flex items-center justify-between border-t border-[#040DBF]/10 pt-2 text-xs">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setDraftStart(null);
                                setDraftEnd(null);
                                onChange('', '');
                                setIsOpen(false);
                            }}
                            className="h-7 px-2 text-xs text-[#020659]/70 hover:text-[#010440]"
                        >
                            Reset
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            className="h-7 bg-[#040DBF] px-3 text-xs text-white hover:bg-[#030A8C]"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
