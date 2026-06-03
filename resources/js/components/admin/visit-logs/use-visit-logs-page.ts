import {
    defaultRowsPerPage,
    sortVisitors,
    visitsInDateRange,
    type SortColumn,
    type SortDirection,
    type VisitLogStatusFilter,
    type VisitorTypeFilter,
} from '@/components/admin/visit-logs/visit-logs-helpers';
import { toIsoDate } from '@/components/ui/date-input-utils';
import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import type { AdminVisitLogs, VisitLogVisitor } from '@/types/dashboard';
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

export function useVisitLogsPage(visitLogs: AdminVisitLogs, initialVisitorType: VisitorTypeFilter = 'student') {
    const schoolYearStart = visitLogs.schoolYear?.starts_at ?? '';
    const schoolYearEnd = visitLogs.schoolYear?.ends_at ?? '';
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
    const [selectedVisitor, setSelectedVisitor] = useState<VisitLogVisitor | null>(null);

    useEchoPublic('library-visits', '.LibraryVisitRecorded', () => {
        router.reload({ only: ['visitLogs'] });
    });

    useEffect(() => {
        setVisitorType(initialVisitorType);
        setYearLevel('');
        setSection('');
        setDepartment('');

        if (initialVisitorType === 'employee' && visitLogs.filters.departments.length === 1) {
            setDepartment(visitLogs.filters.departments[0]);
        }
    }, [initialVisitorType]);

    const effectiveStartDate = startDate || schoolYearStart;
    const effectiveEndDate = endDate || defaultEndDate;

    const visitorsWithRangeVisits = useMemo(() => {
        return visitorsWithDateCoverage(visitLogs.visitors, effectiveStartDate, effectiveEndDate, today);
    }, [effectiveEndDate, effectiveStartDate, today, visitLogs.visitors]);

    const requiredVisits =
        visitorType === 'student'
            ? (visitLogs.schoolYear?.student_required_visits ?? 0)
            : (visitLogs.schoolYear?.employee_required_visits ?? 0);

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

        if (value === 'employee' && visitLogs.filters.departments.length === 1) {
            setDepartment(visitLogs.filters.departments[0]);
        }
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
        if (sortColumn === column) {
            const initialDirection = column === 'visitCount' || column === 'lastVisit' ? 'desc' : 'asc';
            if (sortDirection === initialDirection) {
                setSortDirection(initialDirection === 'asc' ? 'desc' : 'asc');
            } else {
                setSortColumn('lastVisit');
                setSortDirection('desc');
            }
        } else {
            setSortColumn(column);
            setSortDirection(column === 'visitCount' || column === 'lastVisit' ? 'desc' : 'asc');
        }
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
