import type { VisitReport, VisitReportOptions } from '@/types/reports';
import { router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { reportExportUrls } from './report-export-url-builder';
import {
    allFilterValue,
    cleanQuery,
    rowsPerPage,
    sortReportRows,
    toSearchParams,
    type ReportSortColumn,
    type SortDirection,
    type VisitorTypeFilter,
} from './report-helpers';
import { useReportFilters } from './use-report-filters';

interface ReportQuery {
    [key: string]: string;
    school_year_id: string;
    start_date: string;
    end_date: string;
    visitor_type: VisitorTypeFilter;
    year_level: string;
    section: string;
    department: string;
}

export function useReportPage(
    report: VisitReport | null,
    reportOptions: VisitReportOptions,
    initialVisitorType: VisitorTypeFilter = 'student',
    pagePath = '/admin/reports',
) {
    const filters = useReportFilters(report, reportOptions, initialVisitorType);
    const { schoolYearId, startDate, endDate, visitorType, yearLevel, section, department, selectedSchoolYear, dateRangeSummary, reportCanFetch } =
        filters.values;
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<ReportSortColumn | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [showResultsSkeleton, setShowResultsSkeleton] = useState(false);
    const didMountRef = useRef(false);

    const reportRows = useMemo(() => report?.rows ?? [], [report?.rows]);
    const sortedRows = useMemo(
        () => sortReportRows(reportRows, sortColumn, sortDirection, visitorType),
        [visitorType, reportRows, sortColumn, sortDirection],
    );
    const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
    const visibleRows = sortedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const fromRow = sortedRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const toRow = Math.min(currentPage * rowsPerPage, sortedRows.length);

    const query = useMemo<ReportQuery>(
        () => ({
            school_year_id: schoolYearId,
            start_date: startDate,
            end_date: endDate,
            visitor_type: visitorType,
            year_level: visitorType === 'student' && yearLevel !== allFilterValue ? yearLevel : '',
            section: visitorType === 'student' && yearLevel !== allFilterValue && section !== allFilterValue ? section : '',
            department: visitorType === 'employee' && department !== allFilterValue ? department : '',
        }),
        [department, endDate, visitorType, schoolYearId, section, startDate, yearLevel],
    );
    const queryString = useMemo(() => toSearchParams(query).toString(), [query]);
    const reportQueryString = useMemo(() => (report ? toSearchParams(report.filters).toString() : ''), [report]);
    const hasReportResults = Boolean(report && reportCanFetch && queryString === reportQueryString);
    const exportUrls = useMemo(() => reportExportUrls(queryString), [queryString]);

    useEchoPublic('library-visits', '.LibraryVisitRecorded', () => {
        if (reportCanFetch) {
            router.reload({ only: ['report'] });
        }
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [sortedRows]);

    useEffect(() => {
        setSortColumn(null);
        setSortDirection('asc');
    }, [queryString]);

    useEffect(() => {
        if (hasReportResults) {
            setShowResultsSkeleton(false);
        }
    }, [hasReportResults]);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        if (!reportCanFetch) {
            setShowResultsSkeleton(false);

            return;
        }

        const timeout = window.setTimeout(() => {
            setShowResultsSkeleton(true);
            router.get(pagePath, cleanQuery(query), {
                only: ['report'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }, 550);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [pagePath, query, reportCanFetch]);

    const changeSort = (column: ReportSortColumn) => {
        setSortColumn((currentColumn) => {
            if (currentColumn === column) {
                setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));

                return currentColumn;
            }

            setSortDirection(column === 'visit_count' || column === 'progress_percent' ? 'desc' : 'asc');

            return column;
        });
    };

    return {
        filterPanel: filters.filterPanel,
        results: {
            selectedSchoolYear,
            dateRangeSummary,
            exportUrls,
            sortColumn,
            sortDirection,
            visibleRows,
            currentPage,
            totalPages,
            fromRow,
            toRow,
            totalRows: sortedRows.length,
            onSortChange: changeSort,
            onClearSort: () => {
                setSortColumn(null);
                setSortDirection('asc');
            },
            onPageChange: (page: number) => setCurrentPage(Math.min(totalPages, Math.max(1, page))),
        },
        reportCanFetch,
        hasReportResults,
        showResultsSkeleton,
        visitorType,
    };
}
