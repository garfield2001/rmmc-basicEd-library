import { useEffect, useMemo, useState } from 'react';
import type { VisitReport, VisitReportOptions } from '@/types/reports';
import {
    allFilterValue,
    getSchoolYearBounds,
    inferDateRangeMode,
    summarizeDateRange,
    type DateRangeMode,
    type VisitorTypeFilter,
} from './report-helpers';
import { reportFilterValidation } from './report-filter-validation';

export function useReportFilters(report: VisitReport | null, reportOptions: VisitReportOptions) {
    const activeSchoolYear = reportOptions.schoolYears.find((schoolYear) => schoolYear.is_active) ?? reportOptions.schoolYears[0] ?? null;
    const initialSchoolYearId = report?.filters.school_year_id ? String(report.filters.school_year_id) : '';
    const initialSchoolYear = reportOptions.schoolYears.find((schoolYear) => String(schoolYear.id) === initialSchoolYearId) ?? activeSchoolYear;
    const initialVisitorType: VisitorTypeFilter =
        report?.filters.visitor_type === 'employee' || report?.filters.visitor_type === 'student' ? report.filters.visitor_type : '';

    const [schoolYearId, setSchoolYearId] = useState(initialSchoolYearId);
    const [startDate, setStartDate] = useState(report?.filters.start_date ?? '');
    const [endDate, setEndDate] = useState(report?.filters.end_date ?? '');
    const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>(() =>
        report ? inferDateRangeMode(initialSchoolYear, report.filters.start_date, report.filters.end_date) : '',
    );
    const [visitorType, setVisitorType] = useState<VisitorTypeFilter>(initialVisitorType);
    const [yearLevel, setYearLevel] = useState(report ? (report.filters.year_level ?? allFilterValue) : '');
    const [section, setSection] = useState(report ? (report.filters.section ?? allFilterValue) : '');
    const [department, setDepartment] = useState(report ? (report.filters.department ?? allFilterValue) : '');

    const selectedSchoolYear = useMemo(
        () => reportOptions.schoolYears.find((schoolYear) => String(schoolYear.id) === schoolYearId) ?? null,
        [reportOptions.schoolYears, schoolYearId],
    );
    const schoolYearBounds = useMemo(() => getSchoolYearBounds(selectedSchoolYear), [selectedSchoolYear]);
    const sectionSource = useMemo(
        () => (schoolYearId ? (reportOptions.sectionsBySchoolYear[schoolYearId] ?? {}) : reportOptions.sectionsByYearLevel),
        [reportOptions.sectionsBySchoolYear, reportOptions.sectionsByYearLevel, schoolYearId],
    );
    const availableSections = useMemo(
        () => (visitorType === 'student' && yearLevel && yearLevel !== allFilterValue ? (sectionSource[yearLevel] ?? []) : []),
        [visitorType, sectionSource, yearLevel],
    );
    const dateRangeSummary = summarizeDateRange(startDate, endDate);
    const validation = reportFilterValidation({ schoolYearId, startDate, endDate, visitorType, yearLevel, section, department, schoolYearBounds });

    useEffect(() => {
        if (visitorType !== 'student' || !section || section === allFilterValue || availableSections.includes(section)) {
            return;
        }

        setSection('');
    }, [availableSections, visitorType, section]);

    useEffect(() => {
        if (
            visitorType === 'student' &&
            yearLevel &&
            yearLevel !== allFilterValue &&
            availableSections.length === 1 &&
            section !== availableSections[0]
        ) {
            setSection(availableSections[0]);
        }
    }, [availableSections, visitorType, section, yearLevel]);

    useEffect(() => {
        if (visitorType === 'employee' && reportOptions.departments.length === 1 && department !== reportOptions.departments[0]) {
            setDepartment(reportOptions.departments[0]);
        }
    }, [department, visitorType, reportOptions.departments]);

    const resetDependentFilters = () => {
        setVisitorType('');
        setYearLevel('');
        setSection('');
        setDepartment('');
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

        setStartDate(value === 'school_year' ? schoolYearBounds.start : '');
        setEndDate(value === 'school_year' ? schoolYearBounds.end : '');
        resetDependentFilters();
    };

    const chooseVisitorType = (value: VisitorTypeFilter) => {
        setVisitorType(value);

        if (!value) {
            resetDependentFilters();
            return;
        }

        if (value === 'student') {
            setDepartment('');
            return;
        }

        setYearLevel('');
        setSection('');
    };

    return {
        values: {
            schoolYearId,
            startDate,
            endDate,
            visitorType,
            yearLevel,
            section,
            department,
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
            yearLevel,
            section,
            department,
            availableSections,
            dateRangeIsValid: validation.dateRangeIsValid,
            dateRangeSummary,
            onSchoolYearChange: chooseSchoolYear,
            onDateRangeModeChange: chooseDateRangeMode,
            onCustomDateRangeChange: (nextStartDate: string, nextEndDate: string) => {
                setStartDate(nextStartDate);
                setEndDate(nextEndDate);
            },
            onVisitorTypeChange: chooseVisitorType,
            onYearLevelChange: (value: string) => {
                setYearLevel(value);
                setSection('');
            },
            onSectionChange: setSection,
            onDepartmentChange: setDepartment,
        },
    };
}
