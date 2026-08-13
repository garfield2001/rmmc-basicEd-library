import type { WheelEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    buildCalendarDays,
    buildYearOptions,
    clampDate,
    isDateInRange,
    monthStartLimit,
    parseIsoDate,
    startOfMonth,
    toIsoDate,
} from './date-input-utils';

interface UseDateRangeInputStateOptions {
    startDate: string;
    endDate: string;
    onChange: (startDate: string, endDate: string) => void;
    min?: string;
    max?: string;
}

export function useDateRangeInputState({ startDate, endDate, onChange, min, max }: UseDateRangeInputStateOptions) {
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const parsedStart = useMemo(() => parseIsoDate(startDate), [startDate]);
    const parsedEnd = useMemo(() => parseIsoDate(endDate), [endDate]);
    const minDate = useMemo(() => parseIsoDate(min), [min]);
    const maxDate = useMemo(() => parseIsoDate(max), [max]);
    
    const [isOpen, setIsOpen] = useState(false);
    const [popoverAlign, setPopoverAlign] = useState<'left' | 'right'>('left');
    
    const [rangeStart, setRangeStart] = useState<Date | null>(parsedStart);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(parsedEnd);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');

    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(clampDate(parsedStart ?? minDate ?? new Date(), minDate, maxDate)));
    const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
    const yearOptions = useMemo(
        () => buildYearOptions(minDate, maxDate, visibleMonth),
        [maxDate, minDate, visibleMonth],
    );

    useEffect(() => {
        if (!isOpen) {
            setRangeStart(parsedStart);
            setRangeEnd(parsedEnd);
            setHoverDate(null);
            setSelectionStep('start');
            setVisibleMonth(startOfMonth(clampDate(parsedStart ?? minDate ?? new Date(), minDate, maxDate)));
        }
    }, [isOpen, parsedStart, parsedEnd, minDate, maxDate]);

    useEffect(() => {
        if (!isOpen) return;

        const updatePopoverAlignment = () => {
            const rect = wrapperRef.current?.getBoundingClientRect();
            if (!rect) return;
            setPopoverAlign(rect.left + 288 > window.innerWidth - 16 ? 'right' : 'left');
        };

        updatePopoverAlignment();
        window.addEventListener('resize', updatePopoverAlignment);
        window.addEventListener('scroll', updatePopoverAlignment, true);

        return () => {
            window.removeEventListener('resize', updatePopoverAlignment);
            window.removeEventListener('scroll', updatePopoverAlignment, true);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    });

    const chooseDate = (date: Date) => {
        if (!isDateInRange(date, minDate, maxDate)) return;

        if (selectionStep === 'start') {
            setRangeStart(date);
            setRangeEnd(null);
            setSelectionStep('end');
        } else {
            let finalStart = rangeStart!;
            let finalEnd = date;
            
            if (finalEnd < finalStart) {
                finalEnd = rangeStart!;
                finalStart = date;
            }
            
            setRangeStart(finalStart);
            setRangeEnd(finalEnd);
            setSelectionStep('start');
            
            onChange(toIsoDate(finalStart), toIsoDate(finalEnd));
            setIsOpen(false);
        }
    };

    const moveVisibleMonth = (month: number, year: number) => {
        const nextMonth = startOfMonth(clampDate(new Date(year, month, 1), monthStartLimit(minDate), monthStartLimit(maxDate)));
        setVisibleMonth(nextMonth);
    };

    const scrollVisibleMonth = (event: WheelEvent<HTMLSelectElement>) => {
        event.preventDefault();
        event.stopPropagation();
        moveVisibleMonth(visibleMonth.getMonth() + (event.deltaY > 0 ? 1 : -1), visibleMonth.getFullYear());
    };

    const scrollCalendarMonth = (event: WheelEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        moveVisibleMonth(visibleMonth.getMonth() + (event.deltaY > 0 ? 1 : -1), visibleMonth.getFullYear());
    };

    return {
        wrapperRef,
        parsedStart,
        parsedEnd,
        rangeStart,
        rangeEnd,
        hoverDate,
        setHoverDate,
        minDate,
        maxDate,
        isOpen,
        visibleMonth,
        popoverAlign,
        calendarDays,
        yearOptions,
        setIsOpen,
        chooseDate,
        moveVisibleMonth,
        scrollVisibleMonth,
        scrollCalendarMonth,
    };
}
