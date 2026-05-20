import { displayFormatter, monthIndex } from './date-input-months';
export { displayFormatter, monthFormatter, monthOptions } from './date-input-months';

export function formatDisplayDate(value: string) {
    const date = parseIsoDate(value);

    return date ? displayFormatter.format(date) : value;
}

export function parseIsoDate(value?: string) {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return validDate(year, month, day);
}

export function parseTypedDate(value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const isoDate = parseIsoDate(trimmedValue);

    if (isoDate) {
        return isoDate;
    }

    const normalizedValue = trimmedValue
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const match = normalizedValue.match(/^(\d{1,2})[/\-\s](\d{1,2})[/\-\s](\d{4})$/);

    if (match) {
        return validDate(Number(match[3]), Number(match[1]), Number(match[2]));
    }

    const monthNameMatch = normalizedValue.match(/^([a-zA-Z]+)\s+(\d{1,2})\s+(\d{4})$/);

    if (!monthNameMatch) {
        return null;
    }

    const month = monthIndex(monthNameMatch[1]);

    return month ? validDate(Number(monthNameMatch[3]), month, Number(monthNameMatch[2])) : null;
}

export function formatDraftInput(value: string, previousValue: string) {
    if (value.length < previousValue.length || /[a-zA-Z]/.test(value)) {
        return value;
    }

    return value
        .replace(/^(\d{1,2})\s$/, '$1/')
        .replace(/^(\d{1,2})\/(\d{1,2})\s$/, '$1/$2/')
        .replace(/^(\d{1,2})\s+(\d{1,2})$/, '$1/$2')
        .replace(/^(\d{1,2})\s+(\d{1,2})\s+/, '$1/$2/');
}

export function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function monthStartLimit(date: Date | null) {
    return date ? startOfMonth(date) : null;
}

export function buildCalendarDays(month: Date) {
    const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());

    return Array.from({ length: 42 }, (_, index) => new Date(firstVisibleDay.getFullYear(), firstVisibleDay.getMonth(), firstVisibleDay.getDate() + index));
}

export function buildYearOptions(minDate: Date | null, maxDate: Date | null, visibleMonth: Date, yearWindowStart?: number, yearWindowEnd?: number) {
    const firstYear = yearWindowStart ?? minDate?.getFullYear() ?? visibleMonth.getFullYear() - 10;
    const lastYear = yearWindowEnd ?? maxDate?.getFullYear() ?? visibleMonth.getFullYear() + 10;

    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
}

export function formatTypedDate(date: Date) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

export function isDateInRange(date: Date, minDate: Date | null, maxDate: Date | null) {
    const candidate = startOfDay(date);

    if (minDate && candidate < startOfDay(minDate)) {
        return false;
    }

    if (maxDate && candidate > startOfDay(maxDate)) {
        return false;
    }

    return true;
}

export function isMonthInRange(month: number, year: number, minDate: Date | null, maxDate: Date | null) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    if (minDate && monthEnd < startOfMonth(minDate)) {
        return false;
    }

    return !(maxDate && monthStart > startOfMonth(maxDate));
}

export function clampDate(date: Date, minDate: Date | null, maxDate: Date | null) {
    if (minDate && date < minDate) {
        return new Date(minDate);
    }

    if (maxDate && date > maxDate) {
        return new Date(maxDate);
    }

    return new Date(date);
}

export function isSameDay(first: Date, second: Date) {
    return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

export function toIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function validDate(year: number, month: number, day: number) {
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return date;
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
