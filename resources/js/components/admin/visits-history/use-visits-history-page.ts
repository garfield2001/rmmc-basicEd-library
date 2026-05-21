import {
    defaultRowsPerPage,
    sortVisitors,
    visitsInDateRange,
    type SortColumn,
    type SortDirection,
    type VisitorTypeFilter,
} from '@/components/admin/visits-history/visit-history-helpers';
import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import type { AdminVisitHistory, VisitHistoryVisitor } from '@/types/dashboard';
import { router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { useEffect, useMemo, useState } from 'react';
import { countVisitLogRangeVisits, filterVisitLogVisitors, visitorsWithDateCoverage } from './visit-log-filtering';

export function useVisitsHistoryPage(visitHistory: AdminVisitHistory) {
    const schoolYearStart = visitHistory.schoolYear?.starts_at ?? '';
    const schoolYearEnd = visitHistory.schoolYear?.ends_at ?? '';
    const [startDate, setStartDate] = useState(schoolYearStart);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [visitorType, setVisitorType] = useState<VisitorTypeFilter>('student');
    const [yearLevel, setYearLevel] = useState('');
    const [section, setSection] = useState('');
    const [department, setDepartment] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageOption>(defaultRowsPerPage);
    const [sortColumn, setSortColumn] = useState<SortColumn>('lastVisit');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedVisitor, setSelectedVisitor] = useState<VisitHistoryVisitor | null>(null);
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

    useEchoPublic('library-visits', '.LibraryVisitRecorded', () => {
        router.reload({ only: ['visitHistory'] });
    });

    useEffect(() => {
        setStartDate(schoolYearStart);
    }, [schoolYearStart]);

    const visitorsWithRangeVisits = useMemo(() => {
        return visitorsWithDateCoverage(visitHistory.visitors, startDate, endDate, today);
    }, [endDate, startDate, today, visitHistory.visitors]);

    const filteredVisitors = useMemo(() => {
        return filterVisitLogVisitors(visitorsWithRangeVisits, { visitorType, yearLevel, section, department, search });
    }, [department, search, section, visitorType, visitorsWithRangeVisits, yearLevel]);

    const sortedVisitors = useMemo(() => sortVisitors(filteredVisitors, sortColumn, sortDirection), [filteredVisitors, sortColumn, sortDirection]);
    const totalPages = rowsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(sortedVisitors.length / rowsPerPage));
    const visibleVisitors =
        rowsPerPage === 'all' ? sortedVisitors : sortedVisitors.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const selectedVisitorVisits = selectedVisitor ? visitsInDateRange(selectedVisitor.visits, startDate, endDate || today) : [];
    const rangeMetrics = useMemo(() => countVisitLogRangeVisits(visitorsWithRangeVisits), [visitorsWithRangeVisits]);

    useEffect(() => {
        setCurrentPage(1);
    }, [department, endDate, rowsPerPage, search, section, startDate, visitorType, yearLevel]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const changeVisitorType = (value: VisitorTypeFilter) => {
        setVisitorType(value);
        setYearLevel('');
        setSection('');
        setDepartment('');
    };

    const changeYearLevel = (value: string) => {
        setYearLevel(value);
        setSection('');
    };

    const resetDateCoverage = () => {
        setStartDate(schoolYearStart);
        setEndDate(today);
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
        setStartDate,
        setEndDate,
        resetDateCoverage,
        visitorType,
        yearLevel,
        section,
        department,
        search,
        setSearch,
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
