import {
    defaultVisitsPerPage,
    formatVisitTime,
    sortLiveVisits,
    uniqueVisitValues,
    virtualOverscan,
    virtualRowHeight,
    type SortColumn,
    type SortDirection,
    type VisitTab,
} from '@/components/admin/live-visits/live-visits-table-helpers';
import { FilterSelect, LiveVisitLoadingRows, SortableHead, VisitVisitorCell } from '@/components/admin/live-visits/live-visits-table-ui';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VirtualTableSpacerRow } from '@/components/ui/virtual-table-spacer-row';
import { useViewportHeight, useWindowVirtualRows } from '@/hooks/use-window-virtual-rows';
import type { DashboardVisit } from '@/types/dashboard';
import { BarChart3, BriefcaseBusiness, GraduationCap, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface LiveVisitsTableProps {
    visits: DashboardVisit[];
    studentCount: number;
    employeeCount: number;
    mode?: 'live' | 'history';
    onVisitSelect?: (visit: DashboardVisit) => void;
}

export function LiveVisitsTable({ visits, studentCount, employeeCount, mode = 'live', onVisitSelect }: LiveVisitsTableProps) {
    const [visitTab, setVisitTab] = useState<VisitTab>('student');
    const [search, setSearch] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [section, setSection] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageOption>(defaultVisitsPerPage);
    const [isPaging, setIsPaging] = useState(false);
    const [sortColumn, setSortColumn] = useState<SortColumn>('visitedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);
    const pagingTimerRef = useRef<number | null>(null);
    const visitTabs: { label: string; value: VisitTab; count: number; icon: typeof GraduationCap }[] = [
        { label: 'Students', value: 'student', count: studentCount, icon: GraduationCap },
        { label: 'Employees', value: 'employee', count: employeeCount, icon: BriefcaseBusiness },
    ];
    const yearLevelOptions = useMemo(() => uniqueVisitValues(visits, 'yearLevel'), [visits]);
    const sectionOptions = useMemo(() => {
        return uniqueVisitValues(
            visits.filter((visit) => !yearLevel || visit.visitor.yearLevel === yearLevel),
            'section',
        );
    }, [visits, yearLevel]);
    const filteredVisits = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return visits.filter((visit) => {
            const searchable = [
                visit.visitor.schoolId,
                visit.visitor.name,
                visit.visitor.type,
                visit.visitor.yearLevel,
                visit.visitor.section,
                visit.visitor.department,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return (
                visit.visitor.type === visitTab &&
                (visitTab !== 'student' || !yearLevel || visit.visitor.yearLevel === yearLevel) &&
                (visitTab !== 'student' || !section || visit.visitor.section === section) &&
                (!normalizedSearch || searchable.includes(normalizedSearch))
            );
        });
    }, [search, section, visitTab, visits, yearLevel]);
    const sortedVisits = useMemo(() => sortLiveVisits(filteredVisits, sortColumn, sortDirection), [filteredVisits, sortColumn, sortDirection]);
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

    useEffect(() => {
        setCurrentPage(1);
    }, [search, visitTab, rowsPerPage, yearLevel, section]);

    useEffect(() => {
        if (mode !== 'live') {
            return;
        }

        const newestVisitType = visits[0]?.visitor.type;

        if (newestVisitType === 'student' || newestVisitType === 'employee') {
            setVisitTab(newestVisitType);
        }
    }, [mode, visits]);

    useEffect(() => {
        if (visitTab === 'employee') {
            setYearLevel('');
            setSection('');
        }
    }, [visitTab]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    useEffect(() => {
        return () => {
            if (pagingTimerRef.current) {
                window.clearTimeout(pagingTimerRef.current);
            }
        };
    }, []);

    const showBriefTableLoading = () => {
        if (pagingTimerRef.current) {
            window.clearTimeout(pagingTimerRef.current);
        }

        setIsPaging(true);
        pagingTimerRef.current = window.setTimeout(() => {
            setIsPaging(false);
            pagingTimerRef.current = null;
        }, 180);
    };

    const changePage = (nextPage: number) => {
        if (nextPage === currentPage) {
            return;
        }

        showBriefTableLoading();
        setCurrentPage(nextPage);
    };

    const changeRowsPerPage = (nextRowsPerPage: RowsPerPageOption) => {
        if (nextRowsPerPage === rowsPerPage) {
            return;
        }

        showBriefTableLoading();
        setRowsPerPage(nextRowsPerPage);
    };

    const changeYearLevel = (value: string) => {
        setYearLevel(value);
        setSection('');
        setSearch('');
    };

    const changeSection = (value: string) => {
        setSection(value);
        setSearch('');
    };

    const changeSort = (column: SortColumn) => {
        setSortColumn((currentColumn) => {
            if (currentColumn === column) {
                setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));

                return currentColumn;
            }

            setSortDirection(column === 'visitedAt' ? 'desc' : 'asc');

            return column;
        });
    };

    return (
        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
            <div className="space-y-4 border-b border-[#040DBF]/10 px-5 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="size-5 text-[#030A8C]" />
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">
                            {mode === 'history'
                                ? visitTab === 'student'
                                    ? 'Student visit history'
                                    : 'Employee visit history'
                                : visitTab === 'student'
                                  ? 'Student visits today'
                                  : 'Employee visits today'}
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-[#020659]/70">
                        {mode === 'history'
                            ? 'Visits from the active school year are shown newest first.'
                            : 'Latest RFID scans for the selected tab are shown first.'}
                    </p>
                </div>
                <div className="space-y-3">
                    <div className="admin-segmented-tabs w-full sm:w-fit">
                        {visitTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = visitTab === tab.value;

                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => setVisitTab(tab.value)}
                                    className={`admin-segmented-tab ${isActive ? 'admin-segmented-tab-active' : ''}`}
                                >
                                    <Icon className="size-3.5" />
                                    {tab.label}
                                    <span className={isActive ? 'text-white/75' : 'text-[#030A8C]/60'}>{tab.count}</span>
                                </button>
                            );
                        })}
                    </div>
                    {visitTab === 'student' && (
                        <div className="grid gap-3 sm:grid-cols-2 xl:max-w-3xl">
                            <FilterSelect value={yearLevel} options={yearLevelOptions} placeholder="All year levels" onChange={changeYearLevel} />
                            <FilterSelect
                                value={section}
                                options={sectionOptions}
                                placeholder={yearLevel ? 'All sections' : 'Choose year level first'}
                                disabled={!yearLevel}
                                onChange={changeSection}
                            />
                        </div>
                    )}
                    <div className="relative w-full xl:max-w-3xl">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={visitTab === 'student' ? 'Search ID, name, section' : 'Search ID, name, department'}
                            className="h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-9 pl-9 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#030A8C]/50 transition hover:bg-[#040DBF]/5 hover:text-[#010440]"
                                title="Clear search"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table className={visitTab === 'student' ? 'min-w-[760px]' : 'min-w-[640px]'}>
                    <TableHeader className="bg-[#f6f8ff]">
                        <TableRow>
                            <SortableHead
                                column="visitedAt"
                                label={mode === 'history' ? 'Date' : 'Time'}
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={changeSort}
                            />
                            <SortableHead column="schoolId" label="ID" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                            <SortableHead column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                            {visitTab === 'student' ? (
                                <>
                                    <SortableHead
                                        column="group"
                                        label="Year level"
                                        sort={sortColumn}
                                        direction={sortDirection}
                                        onSortChange={changeSort}
                                    />
                                    <TableHead>Section</TableHead>
                                </>
                            ) : (
                                <SortableHead
                                    column="group"
                                    label="Department"
                                    sort={sortColumn}
                                    direction={sortDirection}
                                    onSortChange={changeSort}
                                />
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody ref={tableBodyRef}>
                        {isPaging ? (
                            <LiveVisitLoadingRows columns={visitTab === 'student' ? 5 : 4} />
                        ) : visibleVisits.length > 0 ? (
                            <>
                                {usesVirtualRows && virtualRows.paddingTop > 0 && (
                                    <VirtualTableSpacerRow height={virtualRows.paddingTop} colSpan={visitTab === 'student' ? 5 : 4} />
                                )}
                                {visibleVisits.map((visit) => (
                                    <TableRow
                                        key={visit.id}
                                        onClick={onVisitSelect ? () => onVisitSelect(visit) : undefined}
                                        tabIndex={onVisitSelect ? 0 : undefined}
                                        onKeyDown={
                                            onVisitSelect
                                                ? (event) => {
                                                      if (event.key === 'Enter' || event.key === ' ') {
                                                          event.preventDefault();
                                                          onVisitSelect(visit);
                                                      }
                                                  }
                                                : undefined
                                        }
                                        className={onVisitSelect ? 'cursor-pointer focus-visible:bg-[#f6f8ff] focus-visible:outline-none' : undefined}
                                    >
                                        <TableCell className="text-[#030A8C]">{formatVisitTime(visit, mode)}</TableCell>
                                        <TableCell className="font-medium">{visit.visitor.schoolId}</TableCell>
                                        <TableCell>
                                            <VisitVisitorCell visit={visit} />
                                        </TableCell>
                                        {visitTab === 'student' ? (
                                            <>
                                                <TableCell className="text-[#020659]/70">{visit.visitor.yearLevel || '-'}</TableCell>
                                                <TableCell className="text-[#020659]/70">{visit.visitor.section || '-'}</TableCell>
                                            </>
                                        ) : (
                                            <TableCell className="text-[#020659]/70">{visit.visitor.department || '-'}</TableCell>
                                        )}
                                    </TableRow>
                                ))}
                                {usesVirtualRows && virtualRows.paddingBottom > 0 && (
                                    <VirtualTableSpacerRow height={virtualRows.paddingBottom} colSpan={visitTab === 'student' ? 5 : 4} />
                                )}
                            </>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={visitTab === 'student' ? 5 : 4} className="px-5 py-14 text-center">
                                    <p className="font-medium text-[#010440]">
                                        {visits.length > 0
                                            ? 'No records match the selected filter'
                                            : mode === 'history'
                                              ? 'No visits recorded in the active school year'
                                              : 'No RFID visits recorded today'}
                                    </p>
                                    <p className="mt-2 text-sm text-[#020659]/70">
                                        {visits.length > 0
                                            ? 'Try another filter or search term.'
                                            : mode === 'history'
                                              ? 'Active school-year visit history will appear here after visitors scan in.'
                                              : 'Scanned student and employee visits will appear here.'}
                                    </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                from={sortedVisits.length === 0 ? 0 : rowsPerPage === 'all' ? 1 : (currentPage - 1) * rowsPerPage + 1}
                to={rowsPerPage === 'all' ? sortedVisits.length : Math.min(currentPage * rowsPerPage, sortedVisits.length)}
                total={sortedVisits.length}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 30, 50, 100, 'all']}
                onRowsPerPageChange={changeRowsPerPage}
                onPrevious={() => changePage(Math.max(1, currentPage - 1))}
                onNext={() => changePage(Math.min(totalPages, currentPage + 1))}
                onPageChange={changePage}
            />
        </section>
    );
}
