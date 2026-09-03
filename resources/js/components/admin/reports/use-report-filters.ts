import { parseIsoDate, toIsoDate } from '@/components/ui/date-input-utils';
import type { VisitReport, VisitReportOptions } from '@/types/reports';
import { useEffect, useMemo, useState } from 'react';
import { reportFilterValidation } from './report-filter-validation';
import {
    getSchoolYearBounds,
    inferDateRangeMode,
    summarizeDateRange,
    type DateRangeMode,
    type SchoolYearBounds,
    type VisitorTypeFilter,
} from './report-helpers';

const reportSectionKeySeparator = '::';

function computePresetDates(preset: 'school_year' | 'this_month' | 'last_30_days', bounds: SchoolYearBounds) {
    const bStart = parseIsoDate(bounds.start);
    const bEnd = parseIsoDate(bounds.end);
    if (!bStart || !bEnd || preset === 'school_year') {
        return { start: bounds.start, end: bounds.end };
    }

    const today = new Date();
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isThisMonth = preset === 'this_month';

    const base = now < bStart ? bStart : now > bEnd ? bEnd : now;
    const start = isThisMonth ? new Date(base.getFullYear(), base.getMonth(), 1) : new Date(base.getTime() - 30 * 86400000);
    const end = isThisMonth ? new Date(base.getFullYear(), base.getMonth() + 1, 0) : new Date(base);

    const clampedStart = start < bStart ? bStart : start > bEnd ? bStart : start;
    const clampedEnd = end > bEnd ? bEnd : end < bStart ? bEnd : end;

    return { start: toIsoDate(clampedStart), end: toIsoDate(clampedEnd) };
}

export function useReportFilters(
    report: VisitReport | null,
    reportOptions: VisitReportOptions,
    initialVisitorTypeFromPage: VisitorTypeFilter = 'student',
) {
    const activeSchoolYear = reportOptions.schoolYears.find((schoolYear) => schoolYear.is_active) ?? reportOptions.schoolYears[0] ?? null;
    const initialSchoolYearId = report?.filters.school_year_id ? String(report.filters.school_year_id) : '';
    const initialSchoolYear = reportOptions.schoolYears.find((schoolYear) => String(schoolYear.id) === initialSchoolYearId) ?? activeSchoolYear;
    const initialVisitorType: VisitorTypeFilter =
        report?.filters.visitor_type === 'employee' || report?.filters.visitor_type === 'student'
            ? report.filters.visitor_type
            : initialVisitorTypeFromPage === 'employee'
              ? 'employee'
              : 'student';

    const [schoolYearId, setSchoolYearId] = useState(initialSchoolYearId);
    const [startDate, setStartDate] = useState(report?.filters.start_date ?? '');
    const [endDate, setEndDate] = useState(report?.filters.end_date ?? '');
    const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>(() =>
        report ? inferDateRangeMode(initialSchoolYear, report.filters.start_date, report.filters.end_date) : '',
    );
    const [visitorType, setVisitorType] = useState<VisitorTypeFilter>(initialVisitorType);
    const [yearLevels, setYearLevels] = useState<string[]>(() => initialYearLevels(report, reportOptions.yearLevels));
    const [sections, setSections] = useState<string[]>(() => initialSections(report));
    const [departments, setDepartments] = useState<string[]>(() => initialDepartments(report, reportOptions.departments));
    const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>(() => (report?.filters.order_direction === 'desc' ? 'desc' : 'asc'));

    const selectedSchoolYear = useMemo(
        () => reportOptions.schoolYears.find((schoolYear) => String(schoolYear.id) === schoolYearId) ?? null,
        [reportOptions.schoolYears, schoolYearId],
    );
    const schoolYearBounds = useMemo(() => getSchoolYearBounds(selectedSchoolYear), [selectedSchoolYear]);
    const sectionSource = useMemo(
        () => (schoolYearId ? (reportOptions.sectionsBySchoolYear[schoolYearId] ?? {}) : reportOptions.sectionsByYearLevel),
        [reportOptions.sectionsBySchoolYear, reportOptions.sectionsByYearLevel, schoolYearId],
    );
    const availableSections = useMemo(() => {
        if (visitorType !== 'student' || yearLevels.length === 0) {
            return [];
        }

        return yearLevels.flatMap((yearLevel) =>
            (sectionSource[yearLevel] ?? []).map((section) => ({
                value: sectionKey(yearLevel, section),
                label: `${yearLevel} - ${section}`,
            })),
        );
    }, [visitorType, sectionSource, yearLevels]);
    const dateRangeSummary = summarizeDateRange(startDate, endDate, schoolYearBounds);
    const validation = reportFilterValidation({ schoolYearId, startDate, endDate, visitorType, yearLevels, departments, schoolYearBounds });

    useEffect(() => {
        if (visitorType !== 'student') {
            return;
        }

        const available = new Set(availableSections.map((section) => section.value));
        setSections((current) => current.filter((section) => available.has(section)));
    }, [availableSections, visitorType]);

    useEffect(() => {
        if (visitorType === 'employee' && reportOptions.departments.length === 1 && departments[0] !== reportOptions.departments[0]) {
            setDepartments([reportOptions.departments[0]]);
        }
    }, [departments, visitorType, reportOptions.departments]);

    const resetDependentFilters = () => {
        setVisitorType(initialVisitorTypeFromPage === 'employee' ? 'employee' : 'student');
        setYearLevels([]);
        setSections([]);
        setDepartments([]);
    };

    const chooseSchoolYear = (value: string) => {
        setSchoolYearId(value);

        const schoolYear = reportOptions.schoolYears.find((option) => String(option.id) === value);
        const bounds = schoolYear ? getSchoolYearBounds(schoolYear) : null;

        if (!bounds) {
            return;
        }

        setDateRangeMode('');
        setStartDate('');
        setEndDate('');
        resetDependentFilters();
    };

    const chooseDateRangeMode = (value: DateRangeMode) => {
        setDateRangeMode(value);

        if (!schoolYearBounds) {
            return;
        }

        if (value === 'custom') {
            return;
        }

        if (value === 'school_year' || value === 'this_month' || value === 'last_30_days') {
            const dates = computePresetDates(value, schoolYearBounds);
            setStartDate(dates.start);
            setEndDate(dates.end);
            return;
        }

        setStartDate('');
        setEndDate('');
        resetDependentFilters();
    };

    const chooseVisitorType = (value: VisitorTypeFilter) => {
        setVisitorType(value);

        if (!value) {
            resetDependentFilters();
            return;
        }

        if (value === 'student') {
            setDepartments([]);
            return;
        }

        setYearLevels([]);
        setSections([]);
    };

    const chooseYearLevels = (values: string[]) => {
        setYearLevels(values);

        if (values.length === 0) {
            setSections([]);
            return;
        }

        const nextSections = values.flatMap((yearLevel) => (sectionSource[yearLevel] ?? []).map((section) => sectionKey(yearLevel, section)));
        setSections(nextSections);
        setOrderDirection('asc');
    };

    const applyDatePreset = (preset: 'school_year' | 'this_month' | 'last_30_days') => {
        if (!schoolYearBounds) return;
        const dates = computePresetDates(preset, schoolYearBounds);
        setDateRangeMode(preset === 'school_year' ? 'school_year' : preset);
        setStartDate(dates.start);
        setEndDate(dates.end);
    };

    const resetFilters = () => {
        const defaultYear = activeSchoolYear;
        const defaultYearId = defaultYear ? String(defaultYear.id) : '';
        const bounds = defaultYear ? getSchoolYearBounds(defaultYear) : null;

        setSchoolYearId(defaultYearId);
        setDateRangeMode('school_year');
        setStartDate(bounds?.start ?? '');
        setEndDate(bounds?.end ?? '');
        setVisitorType(initialVisitorTypeFromPage === 'employee' ? 'employee' : 'student');
        setYearLevels(reportOptions.yearLevels);

        const source = defaultYearId ? (reportOptions.sectionsBySchoolYear[defaultYearId] ?? {}) : reportOptions.sectionsByYearLevel;
        const allSecs = reportOptions.yearLevels.flatMap((yl) => (source[yl] ?? []).map((sec) => sectionKey(yl, sec)));
        setSections(allSecs);
        setDepartments(reportOptions.departments);
        setOrderDirection('asc');
    };

    return {
        values: {
            schoolYearId,
            startDate,
            endDate,
            visitorType,
            yearLevels,
            sections,
            departments,
            orderDirection,
            selectedSchoolYear,
            dateRangeSummary,
            reportCanFetch: validation.reportCanFetch,
        },
        filterPanel: {
            reportOptions,
            schoolYearId,
            selectedSchoolYear,
            schoolYearBounds,
            dateRangeMode,
            startDate,
            endDate,
            visitorType,
            yearLevels,
            sections,
            departments,
            orderDirection,
            availableSections,
            showVisitorTypeSelector: false,
            dateRangeIsValid: validation.dateRangeIsValid,
            dateRangeSummary,
            onSchoolYearChange: chooseSchoolYear,
            onDateRangeModeChange: chooseDateRangeMode,
            onCustomDateRangeChange: (nextStartDate: string, nextEndDate: string) => {
                setStartDate(nextStartDate);
                setEndDate(nextEndDate);
            },
            onVisitorTypeChange: chooseVisitorType,
            onYearLevelsChange: chooseYearLevels,
            onSectionsChange: setSections,
            onDepartmentsChange: setDepartments,
            onOrderDirectionChange: setOrderDirection,
            onApplyDatePreset: applyDatePreset,
            onResetFilters: resetFilters,
        },
    };
}

function sectionKey(yearLevel: string, section: string): string {
    return `${yearLevel}${reportSectionKeySeparator}${section}`;
}

function initialYearLevels(report: VisitReport | null, yearLevelOptions: string[]) {
    if (!report) {
        return [];
    }

    if (report.filters.year_levels?.length) {
        return report.filters.year_levels;
    }

    if (!report.filters.year_level || report.filters.year_level === '__all__') {
        return yearLevelOptions;
    }

    return [report.filters.year_level];
}

function initialSections(report: VisitReport | null) {
    if (!report) {
        return [];
    }

    if (report.filters.sections?.length) {
        return report.filters.sections;
    }

    if (report.filters.year_level && report.filters.year_level !== '__all__' && report.filters.section && report.filters.section !== '__all__') {
        return [sectionKey(report.filters.year_level, report.filters.section)];
    }

    return [];
}

function initialDepartments(report: VisitReport | null, departmentOptions: string[]) {
    if (!report) {
        return [];
    }

    if (report.filters.departments?.length) {
        return report.filters.departments;
    }

    if (!report.filters.department || report.filters.department === '__all__') {
        return departmentOptions;
    }

    return [report.filters.department];
}
