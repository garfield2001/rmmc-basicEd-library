import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VirtualTableSpacerRow } from '@/components/ui/virtual-table-spacer-row';
import { useViewportHeight, useWindowVirtualRows } from '@/hooks/use-window-virtual-rows';
import type { DashboardVisit } from '@/types/dashboard';
import { ArrowDown, ArrowUp, BarChart3, BriefcaseBusiness, ChevronsUpDown, GraduationCap, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type VisitTab = 'student' | 'employee';
type SortColumn = 'visitedAt' | 'schoolId' | 'name' | 'group';
type SortDirection = 'asc' | 'desc';

interface LiveVisitsTableProps {
    visits: DashboardVisit[];
    studentCount: number;
    employeeCount: number;
}

const defaultVisitsPerPage = 5;
const virtualRowHeight = 73;
const virtualOverscan = 8;

function formatVisitTime(visit: DashboardVisit) {
    return visit.visitedAt
        ? new Date(visit.visitedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Pending';
}

export function LiveVisitsTable({ visits, studentCount, employeeCount }: LiveVisitsTableProps) {
    const [visitTab, setVisitTab] = useState<VisitTab>('student');
    const [search, setSearch] = useState('');
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

            return visit.visitor.type === visitTab && (!normalizedSearch || searchable.includes(normalizedSearch));
        });
    }, [search, visitTab, visits]);
    const sortedVisits = useMemo(
        () => sortLiveVisits(filteredVisits, sortColumn, sortDirection),
        [filteredVisits, sortColumn, sortDirection],
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

    useEffect(() => {
        setCurrentPage(1);
    }, [search, visitTab, rowsPerPage]);

    useEffect(() => {
        const newestVisitType = visits[0]?.visitor.type;

        if (newestVisitType === 'student' || newestVisitType === 'employee') {
            setVisitTab(newestVisitType);
        }
    }, [visits]);

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
            <div className="flex flex-col gap-4 border-b border-[#040DBF]/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="size-5 text-[#030A8C]" />
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">
                            {visitTab === 'student' ? 'Student visits today' : 'Employee visits today'}
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-[#020659]/70">Latest RFID scans for the selected tab are shown first.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="admin-segmented-tabs order-1 sm:order-none">
                        {visitTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = visitTab === tab.value;

                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => setVisitTab(tab.value)}
                                    className={`admin-segmented-tab h-8 px-3 text-xs ${isActive ? 'admin-segmented-tab-active' : ''}`}
                                >
                                    <Icon className="size-3.5" />
                                    {tab.label}
                                    <span className={isActive ? 'text-white/75' : 'text-[#030A8C]/60'}>{tab.count}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={visitTab === 'student' ? 'Search ID, name, section' : 'Search ID, name, department'}
                            className="h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 sm:w-72"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table className={visitTab === 'student' ? 'min-w-[760px]' : 'min-w-[640px]'}>
                    <TableHeader className="bg-[#f6f8ff]">
                        <TableRow>
                            <SortableHead column="visitedAt" label="Time" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                            <SortableHead column="schoolId" label="ID" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                            <SortableHead column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                            {visitTab === 'student' ? (
                                <>
                                    <SortableHead column="group" label="Year level" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                                    <TableHead>Section</TableHead>
                                </>
                            ) : (
                                <SortableHead column="group" label="Department" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
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
                                    <TableRow key={visit.id}>
                                        <TableCell className="text-[#030A8C]">{formatVisitTime(visit)}</TableCell>
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
                                        {visits.length > 0 ? 'No records match the selected filter' : 'No RFID visits recorded today'}
                                    </p>
                                    <p className="mt-2 text-sm text-[#020659]/70">
                                        {visits.length > 0
                                            ? 'Try another filter or search term.'
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
            />
        </section>
    );
}

function SortableHead({
    column,
    label,
    sort,
    direction,
    onSortChange,
}: {
    column: SortColumn;
    label: string;
    sort: SortColumn;
    direction: SortDirection;
    onSortChange: (column: SortColumn) => void;
}) {
    const active = sort === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <TableHead>
            <button type="button" onClick={() => onSortChange(column)} className="inline-flex items-center gap-1.5 hover:text-[#010440]">
                {label}
                <Icon className="size-3.5" />
            </button>
        </TableHead>
    );
}

function sortLiveVisits(visits: DashboardVisit[], column: SortColumn, direction: SortDirection) {
    return [...visits].sort((first, second) => {
        const firstValue = sortValue(first, column);
        const secondValue = sortValue(second, column);
        const comparison = compareValues(firstValue, secondValue);

        return direction === 'asc' ? comparison : comparison * -1;
    });
}

function sortValue(visit: DashboardVisit, column: SortColumn) {
    if (column === 'visitedAt') {
        return visit.visitedAt ? new Date(visit.visitedAt).getTime() : 0;
    }

    if (column === 'schoolId') {
        return visit.visitor.schoolId ?? '';
    }

    if (column === 'name') {
        return visit.visitor.name ?? '';
    }

    return visit.visitor.type === 'student'
        ? [visit.visitor.yearLevel, visit.visitor.section].filter(Boolean).join(' ')
        : (visit.visitor.department ?? '');
}

function compareValues(first: string | number, second: string | number) {
    if (typeof first === 'number' && typeof second === 'number') {
        return first - second;
    }

    return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' });
}

function LiveVisitLoadingRows({ columns }: { columns: number }) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                    {Array.from({ length: columns }).map((_, columnIndex) => (
                        <TableCell key={columnIndex}>
                            <span
                                className={`admin-page-loading-line h-3 ${
                                    columnIndex === 2 ? 'w-36' : columnIndex % 2 === 0 ? 'w-20' : 'w-28'
                                } max-w-full`}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

function VisitVisitorCell({ visit }: { visit: DashboardVisit }) {
    return (
        <div className="flex items-center gap-3">
            <VisitorAvatar
                name={visit.visitor.name}
                src={visit.visitor.photoUrl}
                className="live-visit-avatar bg-[#eef2ff] text-[#030A8C]/70 ring-1 ring-[#040DBF]/10"
            />
            <span>{visit.visitor.name}</span>
        </div>
    );
}
