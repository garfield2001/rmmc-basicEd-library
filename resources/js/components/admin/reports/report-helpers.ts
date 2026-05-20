import { formatDisplayDate } from '@/components/ui/date-input';
import type { VisitReportRow, VisitReportSchoolYear } from '@/types/reports';

export type VisitorType = 'student' | 'employee';
export type VisitorTypeFilter = '' | VisitorType;
export type DateRangeMode = '' | 'school_year' | 'custom';
export type AllFilterValue = '__all__';
export type ReportSortColumn = 'school_id' | 'name' | 'group' | 'visit_count' | 'progress_percent';
export type SortDirection = 'asc' | 'desc';
export type SchoolYearBounds = {
    start: string;
    end: string;
};

export const rowsPerPage = 10;
export const allFilterValue: AllFilterValue = '__all__';

export function sortReportRows(
    rows: VisitReportRow[],
    column: ReportSortColumn | null,
    direction: SortDirection,
    visitorType: VisitorTypeFilter,
): VisitReportRow[] {
    if (!column) {
        return rows;
    }

    return [...rows].sort((first, second) => {
        const firstValue = reportSortValue(first, column, visitorType);
        const secondValue = reportSortValue(second, column, visitorType);
        const result = compareReportValues(firstValue, secondValue);

        return direction === 'asc' ? result : result * -1;
    });
}

export function toSearchParams(query: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams();

    Object.entries(cleanQuery(query)).forEach(([key, value]) => {
        params.set(key, String(value));
    });

    return params;
}

export function inferDateRangeMode(schoolYear: VisitReportSchoolYear | null, startDate: string, endDate: string): DateRangeMode {
    const bounds = getSchoolYearBounds(schoolYear);

    if (!bounds) {
        return 'custom';
    }

    if (startDate === bounds.start && endDate === bounds.end) {
        return 'school_year';
    }

    return 'custom';
}

export function getSchoolYearBounds(schoolYear: VisitReportSchoolYear | null): SchoolYearBounds | null {
    if (!schoolYear) {
        return null;
    }

    return {
        start: dateOnly(schoolYear.starts_at),
        end: dateOnly(schoolYear.ends_at),
    };
}

export function summarizeDateRange(startDate: string, endDate: string) {
    if (!startDate && !endDate) {
        return 'Choose a custom start and end date';
    }

    if (startDate && !endDate) {
        return `${formatDisplayDate(startDate)} to choose end date`;
    }

    if (!startDate && endDate) {
        return `Choose start date to ${formatDisplayDate(endDate)}`;
    }

    if (startDate === endDate) {
        return formatDisplayDate(startDate);
    }

    return `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`;
}

function reportSortValue(row: VisitReportRow, column: ReportSortColumn, visitorType: VisitorTypeFilter) {
    if (column === 'name') {
        return [row.last_name, row.first_name, row.name].filter(Boolean).join(' ');
    }

    if (column === 'group') {
        return visitorType === 'student'
            ? (row.year_section_label ?? [row.year_level, row.section].filter(Boolean).join(' '))
            : (row.department ?? '');
    }

    return row[column] ?? '';
}

function compareReportValues(first: string | number | boolean, second: string | number | boolean) {
    if (typeof first === 'number' && typeof second === 'number') {
        return first - second;
    }

    return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' });
}

export function cleanQuery(query: Record<string, string | number | null | undefined>) {
    return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value !== null && value !== undefined));
}

function dateOnly(value: VisitReportSchoolYear['starts_at']) {
    return value.slice(0, 10);
}
