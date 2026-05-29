import { type LiveVisitsTableMode, type SortColumn, type SortDirection, type VisitTab } from './live-visits-table-helpers';
import { LiveVisitsTableRows } from '@/components/admin/live-visits/live-visits-table-rows';
import { SortableHead } from '@/components/admin/live-visits/live-visits-table-ui';
import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DashboardVisit } from '@/types/dashboard';
import type { RefObject } from 'react';

interface LiveVisitsTableContentProps {
    mode: LiveVisitsTableMode;
    visitTab: VisitTab;
    visits: DashboardVisit[];
    allVisitsCount: number;
    isPaging: boolean;
    columns: number;
    rowsPerPage: RowsPerPageOption;
    tableMinWidth: string;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    tableBodyRef: RefObject<HTMLTableSectionElement | null>;
    usesVirtualRows: boolean;
    virtualRows: {
        paddingTop: number;
        paddingBottom: number;
    };
    onSortChange: (column: SortColumn) => void;
    onVisitSelect?: (visit: DashboardVisit) => void;
}

export function LiveVisitsTableContent({
    mode,
    visitTab,
    visits,
    allVisitsCount,
    isPaging,
    columns,
    rowsPerPage,
    tableMinWidth,
    sortColumn,
    sortDirection,
    tableBodyRef,
    usesVirtualRows,
    virtualRows,
    onSortChange,
    onVisitSelect,
}: LiveVisitsTableContentProps) {
    return (
        <div className="overflow-x-auto">
            <Table className={tableMinWidth}>
                <TableHeader className="bg-[#f6f8ff]">
                    <TableRow>
                        {mode === 'history' ? (
                            <SortableHead column="visitedAt" label="Date" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                        ) : (
                            <TableHead>Time</TableHead>
                        )}
                        {mode === 'history' ? (
                            <>
                                <SortableHead column="schoolId" label="ID" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                                <SortableHead column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            </>
                        ) : (
                            <>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                            </>
                        )}
                        {visitTab === 'student' ? (
                            <>
                                {mode === 'history' ? (
                                    <SortableHead column="group" label="Year level" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                                ) : (
                                    <TableHead>Year level</TableHead>
                                )}
                                <TableHead>Section</TableHead>
                            </>
                        ) : (
                            mode === 'history' ? (
                                <SortableHead column="group" label="Department" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            ) : (
                                <TableHead>Department</TableHead>
                            )
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody ref={tableBodyRef}>
                    <LiveVisitsTableRows
                        mode={mode}
                        visitTab={visitTab}
                        visits={visits}
                        allVisitsCount={allVisitsCount}
                        isPaging={isPaging}
                        columns={columns}
                        rowsPerPage={rowsPerPage}
                        usesVirtualRows={usesVirtualRows}
                        virtualRows={virtualRows}
                        onVisitSelect={onVisitSelect}
                    />
                </TableBody>
            </Table>
        </div>
    );
}
