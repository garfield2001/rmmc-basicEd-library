import { type VisitorTypeFilter } from './report-helpers';

interface ReportFilterValidationOptions {
    schoolYearId: string;
    startDate: string;
    endDate: string;
    visitorType: VisitorTypeFilter;
    yearLevels: string[];
    departments: string[];
    schoolYearBounds: { start: string; end: string } | null;
}

export function reportFilterValidation({
    schoolYearId,
    startDate,
    endDate,
    visitorType,
    yearLevels,
    departments,
    schoolYearBounds,
}: ReportFilterValidationOptions) {
    const dateRangeIsValid = Boolean(
        schoolYearId &&
        startDate &&
        endDate &&
        startDate <= endDate &&
        (!schoolYearBounds || (startDate >= schoolYearBounds.start && endDate <= schoolYearBounds.end)),
    );
    const studentFiltersComplete = visitorType !== 'student' || yearLevels.length > 0;
    const employeeFiltersComplete = visitorType !== 'employee' || departments.length > 0;

    return {
        dateRangeIsValid,
        reportCanFetch: Boolean(dateRangeIsValid && visitorType && studentFiltersComplete && employeeFiltersComplete),
    };
}
