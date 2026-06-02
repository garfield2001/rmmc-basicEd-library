import {
    defaultRowsPerPage,
    sortVisitors,
    visitsInDateRange,
    type SortColumn,
    type SortDirection,
    type VisitLogStatusFilter,
    type VisitorTypeFilter,
} from '@/components/admin/visits-history/visit-history-helpers';
import { toIsoDate } from '@/components/ui/date-input-utils';
import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import type { AdminVisitHistory, VisitHistoryVisitor } from '@/types/dashboard';
import { router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { useEffect, useMemo, useState } from 'react';
import {
    countVisitLogRangeVisits,
    filterVisitLogStatus,
    filterVisitLogVisitors,
    filterVisitProgressVisitors,
    visitorsWithDateCoverage,
} from './visit-log-filtering';

export function useVisitsHistoryPage(visitHistory: AdminVisitHistory, initialVisitorType: VisitorTypeFilter = 'student') {
    const schoolYearStart = visitHistory.schoolYear?.starts_at ?? '';
    const schoolYearEnd = visitHistory.schoolYear?.ends_at ?? '';
    const today = useMemo(() => toIsoDate(new Date()), []);
    const defaultEndDate = schoolYearEnd && schoolYearEnd < today ? schoolYearEnd : today;
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [visitorType, setVisitorType] = useState<VisitorTypeFilter>(initialVisitorType);
    const [yearLevel, setYearLevel] = useState('');
    const [section, setSection] = useState('');
    const [department, setDepartment] = useState('');
    const [search, setSearch] = useState('');
    const [logStatus, setLogStatus] = useState<VisitLogStatusFilter>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageOption>(defaultRowsPerPage);
    const [sortColumn, setSortColumn] = useState<SortColumn>('lastVisit');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedVisitor, setSelectedVisitor] = useState<VisitHistoryVisitor | null>(null);

    useEchoPublic('library-visits', '.LibraryVisitRecorded', () => {
        router.reload({ only: ['visitHistory'] });
    });

    useEffect(() => {
        setVisitorType(initialVisitorType);
        setYearLevel('');
        setSection('');
        setDepartment('');
    }, [initialVisitorType]);

    const effectiveStartDate = startDate || schoolYearStart;
    const effectiveEndDate = endDate || defaultEndDate;

    const visitorsWithRangeVisits = useMemo(() => {
        return visitorsWithDateCoverage(visitHistory.visitors, effectiveStartDate, effectiveEndDate, today);
    }, [effectiveEndDate, effectiveStartDate, today, visitHistory.visitors]);

    const requiredVisits =
        visitorType === 'student'
            ? (visitHistory.schoolYear?.student_required_visits ?? 0)
            : (visitHistory.schoolYear?.employee_required_visits ?? 0);

    const filteredVisitors = useMemo(() => {
        return filterVisitLogStatus(
            filterVisitLogVisitors(visitorsWithRangeVisits, { visitorType, yearLevel, section, department, search }),
            logStatus,
            requiredVisits,
        );
    }, [department, logStatus, requiredVisits, search, section, visitorType, visitorsWithRangeVisits, yearLevel]);

    const progressVisitors = useMemo(() => {
        return filterVisitProgressVisitors(visitorsWithRangeVisits, { visitorType, yearLevel, section, department, search });
    }, [department, search, section, visitorType, visitorsWithRangeVisits, yearLevel]);

    const sortedVisitors = useMemo(() => sortVisitors(filteredVisitors, sortColumn, sortDirection), [filteredVisitors, sortColumn, sortDirection]);
    const totalPages = rowsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(sortedVisitors.length / rowsPerPage));
    const visibleVisitors = rowsPerPage === 'all' ? sortedVisitors : sortedVisitors.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const selectedVisitorVisits = selectedVisitor ? visitsInDateRange(selectedVisitor.visits, effectiveStartDate, effectiveEndDate) : [];
    const rangeMetrics = useMemo(() => countVisitLogRangeVisits(visitorsWithRangeVisits), [visitorsWithRangeVisits]);

    useEffect(() => {
        setCurrentPage(1);
    }, [department, endDate, logStatus, rowsPerPage, search, section, startDate, visitorType, yearLevel]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const changeVisitorType = (value: VisitorTypeFilter) => {
        setVisitorType(value);
        setYearLevel('');
        setSection('');
        setDepartment('');
        setLogStatus('all');
    };

    const changeYearLevel = (value: string) => {
        setYearLevel(value);
        setSection('');
    };

    const resetDateCoverage = () => {
        setStartDate('');
        setEndDate('');
    };

    const clearFilters = () => {
        setYearLevel('');
        setSection('');
        setDepartment('');
        setSearch('');
        setLogStatus('all');
        setSortColumn('lastVisit');
        setSortDirection('desc');
    };

    const changeSort = (column: SortColumn) => {
        setSortColumn((currentColumn) => {
            if (currentColumn === column) {
                setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));

                return currentColumn;
            }

            setSortDirection(column === 'visitCount' || column === 'lastVisit' ? 'desc' : 'asc');

            return column;
        });
    };

    const changeQuickSort = (value: string) => {
        const [column, direction] = value.split(':') as [SortColumn, SortDirection];

        setSortColumn(column);
        setSortDirection(direction === 'asc' ? 'asc' : 'desc');
    };

    return {
        schoolYearStart,
        schoolYearEnd,
        startDate,
        endDate,
        effectiveStartDate,
        effectiveEndDate,
        setStartDate,
        setEndDate,
        resetDateCoverage,
        clearFilters,
        visitorType,
        yearLevel,
        section,
        department,
        logStatus,
        search,
        setSearch,
        setLogStatus,
        setSection,
        setDepartment,
        changeVisitorType,
        changeYearLevel,
        currentPage,
        rowsPerPage,
        sortColumn,
        sortDirection,
        visibleVisitors,
        visitorsWithRangeVisits,
        progressVisitors,
        sortedVisitors,
        selectedVisitor,
        selectedVisitorVisits,
        setSelectedVisitor,
        rangeMetrics,
        totalPages,
        changeSort,
        changeQuickSort,
        setRowsPerPage,
        previousPage: () => setCurrentPage((page) => Math.max(1, page - 1)),
        nextPage: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
        changePage: (page: number) => setCurrentPage(Math.min(totalPages, Math.max(1, page))),
    };
}
