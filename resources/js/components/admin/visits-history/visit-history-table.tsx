import { formatVisitDateTime, groupLabel, type SortColumn, type SortDirection, type VisitorWithRangeVisits } from './visit-history-helpers';
import { SortableHead } from '@/components/admin/visits-history/visit-history-ui';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';

interface VisitHistoryTableProps {
    visitors: VisitorWithRangeVisits[];
    totalVisitors: number;
    currentPage: number;
    totalPages: number;
    rowsPerPage: RowsPerPageOption;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    onSortChange: (column: SortColumn) => void;
    onRowsPerPageChange: (rows: RowsPerPageOption) => void;
    onPrevious: () => void;
    onNext: () => void;
    onPageChange: (page: number) => void;
    onVisitorOpen: (visitor: VisitorWithRangeVisits) => void;
}

export function VisitHistoryTable({
    visitors,
    totalVisitors,
    currentPage,
    totalPages,
    rowsPerPage,
    sortColumn,
    sortDirection,
    onSortChange,
    onRowsPerPageChange,
    onPrevious,
    onNext,
    onPageChange,
    onVisitorOpen,
}: VisitHistoryTableProps) {
    return (
        <>
            <div className="overflow-x-auto">
                <Table className="min-w-[820px]">
                    <TableHeader className="bg-[#f6f8ff]">
                        <TableRow>
                            <SortableHead column="schoolId" label="ID" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableHead column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableHead
                                column="group"
                                label="Year / section or department"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <SortableHead column="visitCount" label="Visits" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableHead column="lastVisit" label="Last visit" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visitors.length > 0 ? (
                            visitors.map((visitor) => <VisitHistoryTableRow key={visitor.id} visitor={visitor} onOpen={onVisitorOpen} />)
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
                rowsPerPageOptions={[10, 30, 50, 100, 'all']}
                onRowsPerPageChange={onRowsPerPageChange}
                onPrevious={onPrevious}
                onNext={onNext}
                onPageChange={onPageChange}
            />
        </>
    );
}

function VisitHistoryTableRow({ visitor, onOpen }: { visitor: VisitorWithRangeVisits; onOpen: (visitor: VisitorWithRangeVisits) => void }) {
    return (
        <TableRow
            tabIndex={0}
            onClick={() => onOpen(visitor)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen(visitor);
                }
            }}
            className="cursor-pointer focus-visible:bg-[#f6f8ff] focus-visible:outline-none"
        >
            <TableCell className="font-medium text-[#010440]">{visitor.schoolId ?? '-'}</TableCell>
            <TableCell>
                <div className="flex min-w-0 items-center gap-3">
                    <VisitorAvatar
                        name={visitor.name}
                        src={visitor.photoUrl}
                        className="live-visit-avatar bg-[#eef2ff] text-[#030A8C]/70 ring-1 ring-[#040DBF]/10"
                    />
                    <span className="truncate font-medium text-[#010440]">{visitor.name ?? '-'}</span>
                </div>
            </TableCell>
            <TableCell className="text-[#020659]/70">{groupLabel(visitor)}</TableCell>
            <TableCell className="font-semibold text-[#010440]">{visitor.rangeVisits.length}</TableCell>
            <TableCell className="text-[#020659]/70">{formatVisitDateTime(visitor.rangeVisits[0]?.visitedAt)}</TableCell>
        </TableRow>
    );
}

function VisitHistoryEmptyRow() {
    return (
        <TableRow>
            <TableCell colSpan={5} className="px-5 py-14 text-center">
                <p className="font-medium text-[#010440]">No visitors match the selected filters</p>
                <p className="mt-2 text-sm text-[#020659]/70">Try a wider date range or clear one of the visitor filters.</p>
            </TableCell>
        </TableRow>
    );
}
