import { formatDisplayDate } from '@/components/ui/date-input';
import { CalendarDays } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { parseIsoDate, toIsoDate } from '@/components/ui/date-input-utils';
import { VisitLogDateRangeCalendar } from './visit-log-date-range-calendar';

interface VisitLogDateRangePickerProps {
    startDate: string;
    endDate: string;
    minDate: string;
    maxDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
}

export function VisitLogDateRangePicker({ startDate, endDate, minDate, maxDate, onStartDateChange, onEndDateChange }: VisitLogDateRangePickerProps) {
    const [open, setOpen] = useState(false);
    const [activePoint, setActivePoint] = useState<'start' | 'end'>('start');
    const [visibleMonth, setVisibleMonth] = useState(() => parseIsoDate(startDate) ?? new Date());
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);

        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    const chooseDate = (date: Date) => {
        const value = toIsoDate(date);
        const start = parseIsoDate(startDate);
        const end = parseIsoDate(endDate);

        if (activePoint === 'start') {
            onStartDateChange(value);

            if (end && date > end) {
                onEndDateChange(value);
            }

            setActivePoint('end');
        } else {
            onEndDateChange(value);

            if (start && date < start) {
                onStartDateChange(value);
            }

            setActivePoint('start');
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#040DBF]/15 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:border-[#040DBF]/30 focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 focus:outline-none">
                <span>
                    <span className="block text-xs font-semibold tracking-[0.08em] text-[#030A8C] uppercase">Date coverage</span>
                    <span className="mt-1 block font-semibold text-[#010440]">{formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}</span>
                </span>
                <CalendarDays className="size-4 shrink-0 text-[#040DBF]" />
            </button>
            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))]">
                    <VisitLogDateRangeCalendar
                        activePoint={activePoint}
                        visibleMonth={visibleMonth}
                        startDate={startDate}
                        endDate={endDate}
                        minDate={minDate}
                        maxDate={maxDate}
                        onActivePointChange={setActivePoint}
                        onVisibleMonthChange={setVisibleMonth}
                        onDateChoose={chooseDate}
                    />
                </div>
            )}
        </div>
    );
}
