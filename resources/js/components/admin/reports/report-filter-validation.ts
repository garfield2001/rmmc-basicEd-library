import { allFilterValue, type VisitorTypeFilter } from './report-helpers';

interface ReportFilterValidationOptions {
    schoolYearId: string;
    startDate: string;
    endDate: string;
    visitorType: VisitorTypeFilter;
    yearLevel: string;
    section: string;
    department: string;
    schoolYearBounds: { start: string; end: string } | null;
}

export function reportFilterValidation({
    schoolYearId,
    startDate,
    endDate,
    visitorType,
    yearLevel,
    section,
    department,
    schoolYearBounds,
}: ReportFilterValidationOptions) {
    const dateRangeIsValid = Boolean(
        schoolYearId &&
            startDate &&
            endDate &&
            startDate <= endDate &&
            (!schoolYearBounds || (startDate >= schoolYearBounds.start && endDate <= schoolYearBounds.end)),
    );
    const studentFiltersComplete = visitorType !== 'student' || Boolean(yearLevel && (yearLevel === allFilterValue || section));
    const employeeFiltersComplete = visitorType !== 'employee' || Boolean(department);

    return {
        dateRangeIsValid,
        reportCanFetch: Boolean(dateRangeIsValid && visitorType && studentFiltersComplete && employeeFiltersComplete),
    };
}
