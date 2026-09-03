import { PaginationControls } from '@/components/ui/pagination-controls';
import { useViewportHeight, useWindowVirtualRows } from '@/hooks/use-window-virtual-rows';
import { useMemo, useRef, useState } from 'react';
import { VisitorDistributionChart } from '../visitor-distribution-chart';
import { VisitorsTableContent } from './visitors-table-content';
import { VisitorsTableToolbar } from './visitors-table-toolbar';
import type { ColumnOption, VisitorsTableProps } from './visitors-table-types';

const VIRTUAL_ROW_HEIGHT = 73;
const VIRTUAL_OVERSCAN = 8;

export function VisitorsTable({
    visitors,
    activeType,
    distribution,
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

    const [showBreakdown, setShowBreakdown] = useState(false);
    const withRfidCount = useMemo(() => visitors.data.filter((v) => Boolean(v.rfid_uid)).length, [visitors.data]);
    const withoutRfidCount = useMemo(() => visitors.data.filter((v) => !v.rfid_uid).length, [visitors.data]);

    return (
        <div className="relative overflow-hidden rounded-xl border border-[#040DBF]/10 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-busy={isLoading}>
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 dark:from-blue-500 dark:to-indigo-500" />
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
                totalCount={total}
                withRfidCount={withRfidCount}
                withoutRfidCount={withoutRfidCount}
                showBreakdown={showBreakdown}
                onToggleBreakdown={() => setShowBreakdown((prev) => !prev)}
                onSearchChange={onSearchChange}
                onTypeChange={onTypeChange}
                onYearLevelChange={onYearLevelChange}
                onSectionChange={onSectionChange}
                onDepartmentChange={onDepartmentChange}
                onSortClear={onSortClear}
            />

            {/* Collapsible Cohort Breakdown Strip */}
            {showBreakdown && distribution && (
                <div className="border-b border-[#040DBF]/10 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <VisitorDistributionChart activeType={activeType} distribution={distribution} />
                </div>
            )}
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
