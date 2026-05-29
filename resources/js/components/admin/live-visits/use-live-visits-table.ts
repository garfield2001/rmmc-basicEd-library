import {
    filterLiveVisits,
    initialVisitTab,
    liveVisitsTableDescription,
    liveVisitsTableTitle,
    sortLiveVisits,
    uniqueVisitValues,
    virtualOverscan,
    virtualRowHeight,
    type LiveVisitsTableMode,
    type SortColumn,
    type SortDirection,
    type VisitTab,
} from '@/components/admin/live-visits/live-visits-table-helpers';
import { useBriefTablePaging } from '@/components/admin/live-visits/use-brief-table-paging';
import { useViewportHeight, useWindowVirtualRows } from '@/hooks/use-window-virtual-rows';
import type { DashboardVisit } from '@/types/dashboard';
import { BriefcaseBusiness, GraduationCap, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface UseLiveVisitsTableOptions {
    visits: DashboardVisit[];
    studentCount: number;
    employeeCount: number;
    mode: LiveVisitsTableMode;
}

export interface LiveVisitTabOption {
    label: string;
    value: VisitTab;
    count: number;
    icon: LucideIcon;
}

export function useLiveVisitsTable({ visits, studentCount, employeeCount, mode }: UseLiveVisitsTableOptions) {
    const [visitTab, setVisitTab] = useState<VisitTab>(() => initialVisitTab(visits, mode));
    const [search, setSearch] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [section, setSection] = useState('');
    const [department, setDepartment] = useState('');
    const [sortColumn, setSortColumn] = useState<SortColumn>('visitedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);
    const { currentPage, rowsPerPage, isPaging, setCurrentPage, changeRowsPerPage, changePage } = useBriefTablePaging();
    const visitTabs = useMemo<LiveVisitTabOption[]>(
        () => [
            { label: 'Students', value: 'student', count: studentCount, icon: GraduationCap },
            { label: 'Employees', value: 'employee', count: employeeCount, icon: BriefcaseBusiness },
        ],
        [employeeCount, studentCount],
    );
    const yearLevelOptions = useMemo(() => uniqueVisitValues(visits, 'yearLevel'), [visits]);
    const sectionOptions = useMemo(() => {
        return uniqueVisitValues(
            visits.filter((visit) => !yearLevel || visit.visitor.yearLevel === yearLevel),
            'section',
        );
    }, [visits, yearLevel]);
    const departmentOptions = useMemo(() => uniqueVisitValues(visits, 'department'), [visits]);
    const filteredVisits = useMemo(
        () => filterLiveVisits(visits, { visitTab, search, yearLevel, section, department }),
        [department, search, section, visitTab, visits, yearLevel],
    );

    const sortedVisits = useMemo(
        () => sortLiveVisits(filteredVisits, mode === 'live' ? 'visitedAt' : sortColumn, mode === 'live' ? 'desc' : sortDirection),
        [filteredVisits, mode, sortColumn, sortDirection],
    );
    const viewportHeight = useViewportHeight();
    const onePageRowCapacity = Math.max(1, Math.floor(viewportHeight / virtualRowHeight));
    const totalPages = rowsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(sortedVisits.length / rowsPerPage));
    const pagedVisits = rowsPerPage === 'all' ? sortedVisits : sortedVisits.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const usesVirtualRows = rowsPerPage === 'all' && pagedVisits.length > onePageRowCapacity;
    const virtualRows = useWindowVirtualRows({
        enabled: usesVirtualRows,
        itemCount: pagedVisits.length,
        rowHeight: virtualRowHeight,
        overscan: virtualOverscan,
        containerRef: tableBodyRef,
    });
    const visibleVisits = usesVirtualRows ? pagedVisits.slice(virtualRows.startIndex, virtualRows.endIndex) : pagedVisits;

    useEffect(() => setCurrentPage(1), [search, visitTab, rowsPerPage, yearLevel, section]);

    useEffect(() => {
        if (visitTab === 'employee') {
            setYearLevel('');
            setSection('');
        } else {
            setDepartment('');
        }
    }, [visitTab]);

    useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

    const changeYearLevel = (value: string) => {
        setYearLevel(value);
        setSection('');
        setSearch('');
    };

    const changeSort = (column: SortColumn) => {
        if (mode === 'live') {
            return;
        }

        setSortColumn((currentColumn) => {
            if (currentColumn === column) {
                setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));

                return currentColumn;
            }

            setSortDirection(column === 'visitedAt' ? 'desc' : 'asc');

            return column;
        });
    };

    return {
        title: liveVisitsTableTitle(mode, visitTab),
        description: liveVisitsTableDescription(mode),
        visitTab,
        visitTabs,
        search,
        yearLevel,
        section,
        department,
        yearLevelOptions,
        sectionOptions,
        departmentOptions,
        currentPage,
        rowsPerPage,
        isPaging,
        sortColumn,
        sortDirection,
        tableBodyRef,
        tableColumnCount: visitTab === 'student' ? 5 : 4,
        tableMinWidth: visitTab === 'student' ? 'min-w-[760px]' : 'min-w-[640px]',
        sortedVisits,
        visibleVisits,
        totalPages,
        usesVirtualRows,
        virtualRows,
        setVisitTab,
        setSearch,
        changeYearLevel,
        changeSection: (value: string) => {
            setSection(value);
            setSearch('');
        },
        changeDepartment: (value: string) => {
            setDepartment(value);
            setSearch('');
        },
        changeSort,
        changeRowsPerPage,
        previousPage: () => changePage(Math.max(1, currentPage - 1)),
        nextPage: () => changePage(Math.min(totalPages, currentPage + 1)),
        changePage,
    };
}
