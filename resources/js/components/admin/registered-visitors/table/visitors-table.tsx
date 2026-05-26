import { PaginationControls } from '@/components/ui/pagination-controls';
import { useViewportHeight, useWindowVirtualRows } from '@/hooks/use-window-virtual-rows';
import { useMemo, useRef } from 'react';
import { VisitorsTableContent } from './visitors-table-content';
import { VisitorsTableToolbar } from './visitors-table-toolbar';
import type { ColumnOption, VisitorsTableProps } from './visitors-table-types';

const VIRTUAL_ROW_HEIGHT = 73;
const VIRTUAL_OVERSCAN = 8;

export function VisitorsTable({
    visitors,
    activeType,
    search,
    yearLevel,
    section,
    department,
    yearLevels,
    sections,
    departments,
    rowsPerPage,
    sort,
    direction,
    isLoading = false,
    showTypeTabs = true,
    onSearchChange,
    onTypeChange,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    onRowsPerPageChange,
    onSortChange,
    onSortClear,
    onEdit,
    onPrevious,
    onNext,
    onPageChange,
}: VisitorsTableProps) {
    const currentPage = visitors.meta?.current_page ?? visitors.current_page ?? 1;
    const totalPages = visitors.meta?.last_page ?? visitors.last_page ?? 1;
    const from = visitors.meta?.from ?? visitors.from ?? 0;
    const to = visitors.meta?.to ?? visitors.to ?? 0;
    const total = visitors.meta?.total ?? visitors.total ?? visitors.data.length;
    const columns = useMemo<ColumnOption[]>(() => visitorColumns(activeType), [activeType]);
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
            <VisitorsTableToolbar
                activeType={activeType}
                search={search}
                yearLevel={yearLevel}
                section={section}
                department={department}
                yearLevels={yearLevels}
                sections={sections}
                departments={departments}
                sort={sort}
                showTypeTabs={showTypeTabs}
                onSearchChange={onSearchChange}
                onTypeChange={onTypeChange}
                onYearLevelChange={onYearLevelChange}
                onSectionChange={onSectionChange}
                onDepartmentChange={onDepartmentChange}
                onSortClear={onSortClear}
            />
            <VisitorsTableContent
                activeType={activeType}
                columns={columns}
                visibleColumnCount={visibleColumnCount}
                visitors={visitors.data}
                displayedVisitors={displayedVisitors}
                isLoading={isLoading}
                rowsPerPage={rowsPerPage}
                sort={sort}
                direction={direction}
                usesVirtualRows={usesVirtualRows}
                paddingTop={virtualRows.paddingTop}
                paddingBottom={virtualRows.paddingBottom}
                tableBodyRef={tableBodyRef}
                onSortChange={onSortChange}
                onEdit={onEdit}
            />
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
                onPageChange={onPageChange}
            />
        </div>
    );
}

function visitorColumns(activeType: VisitorsTableProps['activeType']): ColumnOption[] {
    const sharedColumns: ColumnOption[] = [
        { key: 'visitor', label: activeType === 'student' ? 'Student' : 'Employee' },
        { key: 'school_id', label: 'School ID' },
    ];

    return activeType === 'student'
        ? [...sharedColumns, { key: 'year_level', label: 'Year level' }, { key: 'section', label: 'Section' }]
        : [...sharedColumns, { key: 'department', label: 'Department' }];
}
