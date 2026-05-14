import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VirtualTableSpacerRow } from '@/components/ui/virtual-table-spacer-row';
import { useViewportHeight, useWindowVirtualRows } from '@/hooks/use-window-virtual-rows';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types/pagination';
import type { RegisteredVisitorRow } from '@/types/registered-visitors';
import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, RotateCcw, Search } from 'lucide-react';
import { useMemo, useRef } from 'react';

type VisitorType = 'student' | 'employee';
type SortDirection = 'asc' | 'desc';
type ColumnKey = 'visitor' | 'school_id' | 'year_level' | 'section' | 'department';
const VIRTUAL_ROW_HEIGHT = 73;
const VIRTUAL_OVERSCAN = 8;

interface ColumnOption {
    key: ColumnKey;
    label: string;
}

interface VisitorsTableProps {
    visitors: Paginated<RegisteredVisitorRow>;
    activeType: VisitorType;
    search: string;
    rowsPerPage: RowsPerPageOption;
    sort: string;
    direction: SortDirection;
    isLoading?: boolean;
    onSearchChange: (value: string) => void;
    onRowsPerPageChange: (rows: RowsPerPageOption) => void;
    onSortChange: (column: string) => void;
    onSortClear: () => void;
    onEdit: (visitor: RegisteredVisitorRow) => void;
    onPrevious: () => void;
    onNext: () => void;
}

export function VisitorsTable({
    visitors,
    activeType,
    search,
    rowsPerPage,
    sort,
    direction,
    isLoading = false,
    onSearchChange,
    onRowsPerPageChange,
    onSortChange,
    onSortClear,
    onEdit,
    onPrevious,
    onNext,
}: VisitorsTableProps) {
    const currentPage = visitors.meta?.current_page ?? visitors.current_page ?? 1;
    const totalPages = visitors.meta?.last_page ?? visitors.last_page ?? 1;
    const from = visitors.meta?.from ?? visitors.from ?? 0;
    const to = visitors.meta?.to ?? visitors.to ?? 0;
    const total = visitors.meta?.total ?? visitors.total ?? visitors.data.length;
    const columns = useMemo<ColumnOption[]>(() => {
        const sharedColumns: ColumnOption[] = [
            { key: 'visitor', label: activeType === 'student' ? 'Student' : 'Employee' },
            { key: 'school_id', label: 'School ID' },
        ];

        return activeType === 'student'
            ? [...sharedColumns, { key: 'year_level', label: 'Year level' }, { key: 'section', label: 'Section' }]
            : [...sharedColumns, { key: 'department', label: 'Department' }];
    }, [activeType]);
    const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);
    const visibleColumnCount = columns.length + 1;
    const viewportHeight = useViewportHeight();
    const onePageRowCapacity = Math.max(1, Math.floor(viewportHeight / VIRTUAL_ROW_HEIGHT));
    const usesVirtualRows = !isLoading && rowsPerPage === 'all' && visitors.data.length > onePageRowCapacity;
    const virtualRows = useWindowVirtualRows({
        enabled: usesVirtualRows,
        itemCount: visitors.data.length,
        rowHeight: VIRTUAL_ROW_HEIGHT,
        overscan: VIRTUAL_OVERSCAN,
        containerRef: tableBodyRef,
    });
    const displayedVisitors = usesVirtualRows ? visitors.data.slice(virtualRows.startIndex, virtualRows.endIndex) : visitors.data;

    return (
        <div className="relative rounded-xl border border-zinc-200 bg-white shadow-sm" aria-busy={isLoading}>
            <div className="flex min-h-16 flex-col gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={`Search ${activeType === 'student' ? 'students' : 'employees'}`}
                        className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-3 pl-9 text-sm outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                    />
                </div>
                {sort !== 'created_at' && (
                    <button
                        type="button"
                        onClick={onSortClear}
                        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm sm:w-auto"
                    >
                        <RotateCcw className="size-4" />
                        Clear sort
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <Table className={activeType === 'student' ? 'min-w-170' : 'min-w-140'}>
                    <TableHeader className="bg-zinc-50">
                        <TableRow>
                            <SortableHead column="name" label={activeType === 'student' ? 'Student' : 'Employee'} sort={sort} direction={direction} onSortChange={onSortChange} />
                            <SortableHead column="school_id" label="School ID" sort={sort} direction={direction} onSortChange={onSortChange} />
                            {activeType === 'student' ? (
                                <>
                                    <SortableHead column="year_level" label="Year level" sort={sort} direction={direction} onSortChange={onSortChange} />
                                    <SortableHead column="section" label="Section" sort={sort} direction={direction} onSortChange={onSortChange} />
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
                        ) : visitors.data.length > 0 ? (
                            <>
                                {usesVirtualRows && virtualRows.paddingTop > 0 && (
                                    <VirtualTableSpacerRow height={virtualRows.paddingTop} colSpan={visibleColumnCount} />
                                )}
                                {displayedVisitors.map((visitor) => (
                                    <VisitorDataRow key={visitor.id} visitor={visitor} activeType={activeType} onEdit={() => onEdit(visitor)} />
                                ))}
                                {usesVirtualRows && virtualRows.paddingBottom > 0 && (
                                    <VirtualTableSpacerRow height={virtualRows.paddingBottom} colSpan={visibleColumnCount} />
                                )}
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
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                from={from ?? 0}
                to={to ?? 0}
                total={total}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 30, 50, 100, 'all']}
                onRowsPerPageChange={onRowsPerPageChange}
                onPrevious={onPrevious}
                onNext={onNext}
            />
        </div>
    );
}

function VisitorDataRow({ visitor, activeType, onEdit }: { visitor: RegisteredVisitorRow; activeType: VisitorType; onEdit: () => void }) {
    return (
        <TableRow>
            <TableCell>
                <VisitorIdentity visitor={visitor} />
            </TableCell>
            <TableCell className="font-medium">{visitor.school_id}</TableCell>
            {activeType === 'student' ? (
                <>
                    <TableCell className="text-zinc-500">{visitor.student?.year_level || '-'}</TableCell>
                    <TableCell className="text-zinc-500">{visitor.student?.section || '-'}</TableCell>
                </>
            ) : (
                <TableCell className="text-zinc-500">{visitor.employee?.department || '-'}</TableCell>
            )}
            <TableCell>
                <div className="flex justify-end">
                    <ActionButton label="Edit visitor" icon={Pencil} onClick={onEdit} />
                </div>
            </TableCell>
        </TableRow>
    );
}

function LoadingRows({ columns, activeType, rowCount }: { columns: ColumnOption[]; activeType: VisitorType; rowCount: number }) {
    return (
        <>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                    {columns.map((column) => (
                        <TableCell key={column.key}>
                            <LoadingCell column={column.key} activeType={activeType} />
                        </TableCell>
                    ))}
                    <TableCell>
                        <div className="flex justify-end">
                            <SkeletonBlock className="size-9 rounded-lg" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

function LoadingCell({ column, activeType }: { column: ColumnKey; activeType: VisitorType }) {
    if (column === 'visitor') {
        return (
            <div className="flex items-center gap-3">
                <SkeletonBlock className="size-10 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-3.5 w-36 max-w-full rounded-full" />
                    <SkeletonBlock className="h-3 w-24 max-w-full rounded-full" />
                </div>
            </div>
        );
    }

    if (column === 'year_level' || column === 'department') {
        return <SkeletonBlock className={`h-3.5 rounded-full ${activeType === 'employee' ? 'w-44' : 'w-24'}`} />;
    }

    return <SkeletonBlock className="h-3.5 w-28 rounded-full" />;
}

function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse bg-zinc-200/80 ${className}`} />;
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

function VisitorIdentity({ visitor }: { visitor: RegisteredVisitorRow }) {
    return (
        <div className="flex items-center gap-3">
            <VisitorAvatar name={visitor.name} src={visitor.photo_url} />
            <p className="min-w-0 font-medium">{visitor.name}</p>
        </div>
    );
}

function ActionButton({ label, icon: Icon, onClick }: { label: string; icon: typeof Pencil; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn('inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100')}
            title={label}
        >
            <Icon className="size-4" />
        </button>
    );
}
