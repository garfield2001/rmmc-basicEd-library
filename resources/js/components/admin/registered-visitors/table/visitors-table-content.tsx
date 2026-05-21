import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VirtualTableSpacerRow } from '@/components/ui/virtual-table-spacer-row';
import type { LibraryMemberRow } from '@/types/registered-visitors';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type React from 'react';
import type { ColumnOption, SortDirection, VisitorType } from './visitors-table-types';
import { LoadingRows, VisitorDataRow } from './visitors-table-rows';

interface VisitorsTableContentProps {
    activeType: VisitorType;
    columns: ColumnOption[];
    visibleColumnCount: number;
    visitors: LibraryMemberRow[];
    displayedVisitors: LibraryMemberRow[];
    isLoading: boolean;
    rowsPerPage: number | 'all';
    sort: string;
    direction: SortDirection;
    usesVirtualRows: boolean;
    paddingTop: number;
    paddingBottom: number;
    tableBodyRef: React.RefObject<HTMLTableSectionElement | null>;
    onSortChange: (column: string) => void;
    onEdit: (visitor: LibraryMemberRow) => void;
}

export function VisitorsTableContent({
    activeType,
    columns,
    visibleColumnCount,
    visitors,
    displayedVisitors,
    isLoading,
    rowsPerPage,
    sort,
    direction,
    usesVirtualRows,
    paddingTop,
    paddingBottom,
    tableBodyRef,
    onSortChange,
    onEdit,
}: VisitorsTableContentProps) {
    return (
        <div className="overflow-x-auto">
            <Table className={activeType === 'student' ? 'min-w-170' : 'min-w-140'}>
                <TableHeader className="bg-zinc-50">
                    <TableRow>
                        <SortableHead column="name" label={activeType === 'student' ? 'Student' : 'Employee'} sort={sort} direction={direction} onSortChange={onSortChange} />
                        <TableHead>School ID</TableHead>
                        {activeType === 'student' ? (
                            <>
                                <SortableHead column="year_level" label="Year level" sort={sort} direction={direction} onSortChange={onSortChange} />
                                <TableHead>Section</TableHead>
                            </>
                        ) : (
                            <SortableHead column="department" label="Department" sort={sort} direction={direction} onSortChange={onSortChange} />
                        )}
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody ref={tableBodyRef}>
                    {isLoading ? (
                        <LoadingRows columns={columns} activeType={activeType} rowCount={rowsPerPage === 'all' ? 10 : Math.min(rowsPerPage, 10)} />
                    ) : visitors.length > 0 ? (
                        <>
                            {usesVirtualRows && paddingTop > 0 && <VirtualTableSpacerRow height={paddingTop} colSpan={visibleColumnCount} />}
                            {displayedVisitors.map((visitor) => (
                                <VisitorDataRow key={visitor.id} visitor={visitor} activeType={activeType} onEdit={() => onEdit(visitor)} />
                            ))}
                            {usesVirtualRows && paddingBottom > 0 && <VirtualTableSpacerRow height={paddingBottom} colSpan={visibleColumnCount} />}
                        </>
                    ) : (
                        <TableRow>
                            <TableCell colSpan={visibleColumnCount} className="px-5 py-14 text-center text-sm text-zinc-500">
                                No {activeType === 'student' ? 'students' : 'employees'} found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function SortableHead({
    column,
    label,
    sort,
    direction,
    onSortChange,
}: {
    column: string;
    label: string;
    sort: string;
    direction: SortDirection;
    onSortChange: (column: string) => void;
}) {
    const active = sort === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <TableHead>
            <button type="button" onClick={() => onSortChange(column)} className="inline-flex items-center gap-1.5 hover:text-zinc-900">
                {label}
                <Icon className="size-3.5" />
            </button>
        </TableHead>
    );
}
