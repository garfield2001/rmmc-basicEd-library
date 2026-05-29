import { SortableHead } from '@/components/admin/visits-history/visit-history-ui';
import { formatDisplayDate } from '@/components/ui/date-input';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { SelectInput } from '@/components/ui/select-input';
import { Table, TableBody, TableHeader, TablePlaceholderRows, TableRow } from '@/components/ui/table';
import { Funnel } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { SortColumn, SortDirection, VisitLogStatusFilter, VisitorWithRangeVisits } from './visit-history-helpers';
import { VisitHistoryEmptyRow, VisitHistoryTableRow } from './visit-history-table-rows';
import { VisitSearchControl, VisitSortOptions, VisitStatusOptions } from './visit-table-controls';

interface VisitHistoryTableProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: 'student' | 'employee';
    totalVisitors: number;
    startDate: string;
    endDate: string;
    requiredVisits: number;
    currentPage: number;
    totalPages: number;
    rowsPerPage: RowsPerPageOption;
    activeVisitorCount: number;
    search: string;
    logStatus: VisitLogStatusFilter;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    selectedVisitorId?: number | null;
    filterPanel?: ReactNode;
    onSortChange: (column: SortColumn) => void;
    onSearchChange: (value: string) => void;
    onLogStatusChange: (value: VisitLogStatusFilter) => void;
    onQuickSortChange: (value: string) => void;
    onRowsPerPageChange: (rows: RowsPerPageOption) => void;
    onPrevious: () => void;
    onNext: () => void;
    onPageChange: (page: number) => void;
    onVisitorOpen: (visitor: VisitorWithRangeVisits) => void;
}

export function VisitHistoryTable({
    visitors,
    visitorType,
    totalVisitors,
    startDate,
    endDate,
    requiredVisits,
    currentPage,
    totalPages,
    rowsPerPage,
    activeVisitorCount,
    search,
    logStatus,
    sortColumn,
    sortDirection,
    selectedVisitorId,
    filterPanel,
    onSortChange,
    onSearchChange,
    onLogStatusChange,
    onQuickSortChange,
    onRowsPerPageChange,
    onPrevious,
    onNext,
    onPageChange,
    onVisitorOpen,
}: VisitHistoryTableProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const groupHeader = visitorType === 'student' ? 'Year / section' : 'Department';
    const searchPlaceholder = visitorType === 'student' ? 'Search ID, name, section' : 'Search ID, name, department';
    const placeholderRows = rowsPerPage === 'all' || visitors.length === 0 ? 0 : Math.max(0, rowsPerPage - visitors.length);
    const sortValue = `${sortColumn}:${sortDirection}`;

    return (
        <>
            <div className="border-b border-[#040DBF]/10 px-5 py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Visitor log records</h2>
                        <p className="mt-1 text-sm text-[#020659]/70">
                            Showing {totalVisitors.toLocaleString()} visitor{totalVisitors === 1 ? '' : 's'} from {formatDisplayDate(startDate)} to{' '}
                            {formatDisplayDate(endDate)}. {activeVisitorCount.toLocaleString()} had visits in this coverage.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((current) => !current)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-semibold text-[#030A8C] transition hover:border-[#040DBF]/25 hover:bg-[#f6f8ff]"
                        aria-expanded={filtersOpen}
                    >
                        <Funnel className="size-4" />
                        Filters
                    </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-[minmax(14rem,20rem)_12rem_13rem]">
                    <VisitSearchControl search={search} placeholder={searchPlaceholder} className="" onSearchChange={onSearchChange} />
                    <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                        Sort
                        <SelectInput value={sortValue} onChange={(event) => onQuickSortChange(event.target.value)}>
                            <VisitSortOptions />
                        </SelectInput>
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                        Requirement status
                        <SelectInput value={logStatus} onChange={(event) => onLogStatusChange(event.target.value as VisitLogStatusFilter)}>
                            <VisitStatusOptions />
                        </SelectInput>
                    </label>
                </div>
            </div>
            {filtersOpen && filterPanel}
            <div className="overflow-x-auto">
                <Table className="w-full min-w-205">
                    <TableHeader className="bg-[#f6f8ff]">
                        <TableRow>
                            <SortableHead column="schoolId" label="ID" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableHead column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableHead
                                column="group"
                                label={groupHeader}
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <SortableHead
                                column="visitCount"
                                label="Visits"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <SortableHead
                                column="lastVisit"
                                label="Last visit"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visitors.length > 0 ? (
                            <>
                                {visitors.map((visitor) => (
                                    <VisitHistoryTableRow
                                        key={visitor.id}
                                        visitor={visitor}
                                        requiredVisits={requiredVisits}
                                        selected={selectedVisitorId === visitor.id}
                                        onOpen={onVisitorOpen}
                                    />
                                ))}
                                <TablePlaceholderRows rowCount={placeholderRows} colSpan={5} />
                            </>
                        ) : (
                            <VisitHistoryEmptyRow />
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                from={totalVisitors === 0 ? 0 : rowsPerPage === 'all' ? 1 : (currentPage - 1) * rowsPerPage + 1}
                to={rowsPerPage === 'all' ? totalVisitors : Math.min(currentPage * rowsPerPage, totalVisitors)}
                total={totalVisitors}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 30, 50, 100, 'all']}
                onRowsPerPageChange={onRowsPerPageChange}
                onPrevious={onPrevious}
                onNext={onNext}
                onPageChange={onPageChange}
            />
        </>
    );
}
