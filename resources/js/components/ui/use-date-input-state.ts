import type { WheelEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    buildCalendarDays,
    buildYearOptions,
    clampDate,
    displayFormatter,
    formatDraftInput,
    formatTypedDate,
    isDateInRange,
    monthStartLimit,
    parseIsoDate,
    parseTypedDate,
    startOfMonth,
    toIsoDate,
} from './date-input-utils';

interface UseDateInputStateOptions {
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    openOnFocus: boolean;
    yearWindowStart?: number;
    yearWindowEnd?: number;
}

export function useDateInputState({ value, onChange, min, max, openOnFocus, yearWindowStart, yearWindowEnd }: UseDateInputStateOptions) {
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

    const commitDraft = () => {
        if (!isEditing) {
            return;
        }

        if (draftValue.trim() === '') {
            onChange('');
            setIsEditing(false);
            return;
        }

        const parsedDate = parseTypedDate(draftValue);

        if (parsedDate) {
            onChange(toIsoDate(clampDate(parsedDate, minDate, maxDate)));
        }

        setIsEditing(false);
    };

    useEffect(() => {
        setVisibleMonth(startOfMonth(clampDate(selectedDate ?? minDate ?? new Date(), minDate, maxDate)));
    }, [maxDate, minDate, selectedDate]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                commitDraft();
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);

        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    });

    const chooseDate = (date: Date) => {
        if (!isDateInRange(date, minDate, maxDate)) {
            return;
        }

        onChange(toIsoDate(date));
        setDraftValue(formatTypedDate(date));
        setIsEditing(false);
        setIsOpen(false);
    };

    const moveVisibleMonth = (month: number, year: number) => {
        const nextMonth = startOfMonth(clampDate(new Date(year, month, 1), monthStartLimit(minDate), monthStartLimit(maxDate)));

        setVisibleMonth(nextMonth);
    };

    const scrollVisibleMonth = (event: WheelEvent<HTMLSelectElement>) => {
        event.preventDefault();
        moveVisibleMonth(visibleMonth.getMonth() + (event.deltaY > 0 ? 1 : -1), visibleMonth.getFullYear());
    };

    return {
        wrapperRef,
        selectedDate,
        minDate,
        maxDate,
        isOpen,
        visibleMonth,
        calendarDays,
        yearOptions,
        inputValue: isEditing ? draftValue : selectedDate ? displayFormatter.format(selectedDate) : '',
        setIsOpen,
        beginEditing: () => {
            setIsEditing(true);
            setDraftValue(selectedDate ? formatTypedDate(selectedDate) : '');
            setIsOpen(openOnFocus);
        },
        updateDraft: (value: string) => setDraftValue(formatDraftInput(value, draftValue)),
        commitDraft,
        chooseDate,
        moveVisibleMonth,
        scrollVisibleMonth,
    };
}
