import { LiveVisitsTableContent } from '@/components/admin/live-visits/live-visits-table-content';
import { type LiveVisitsTableMode } from '@/components/admin/live-visits/live-visits-table-helpers';
import { LiveVisitsTableHeader } from '@/components/admin/live-visits/live-visits-table-header';
import { useLiveVisitsTable } from '@/components/admin/live-visits/use-live-visits-table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import type { DashboardVisit } from '@/types/dashboard';

interface LiveVisitsTableProps {
    visits: DashboardVisit[];
    studentCount: number;
    employeeCount: number;
    mode?: LiveVisitsTableMode;
    onVisitSelect?: (visit: DashboardVisit) => void;
}

export function LiveVisitsTable({ visits, studentCount, employeeCount, mode = 'live', onVisitSelect }: LiveVisitsTableProps) {
    const table = useLiveVisitsTable({ visits, studentCount, employeeCount, mode });

    return (
        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
            <LiveVisitsTableHeader
                title={table.title}
                description={table.description}
                visitTab={table.visitTab}
                visitTabs={table.visitTabs}
                search={table.search}
                yearLevel={table.yearLevel}
                section={table.section}
                yearLevelOptions={table.yearLevelOptions}
                sectionOptions={table.sectionOptions}
                onVisitTabChange={table.setVisitTab}
                onSearchChange={table.setSearch}
                onYearLevelChange={table.changeYearLevel}
                onSectionChange={table.changeSection}
            />

            <LiveVisitsTableContent
                mode={mode}
                visitTab={table.visitTab}
                visits={table.visibleVisits}
                allVisitsCount={visits.length}
                isPaging={table.isPaging}
                columns={table.tableColumnCount}
                tableMinWidth={table.tableMinWidth}
                sortColumn={table.sortColumn}
                sortDirection={table.sortDirection}
                tableBodyRef={table.tableBodyRef}
                usesVirtualRows={table.usesVirtualRows}
                virtualRows={table.virtualRows}
                onSortChange={table.changeSort}
                onVisitSelect={onVisitSelect}
            />

            <PaginationControls
                currentPage={table.currentPage}
                totalPages={table.totalPages}
                from={table.sortedVisits.length === 0 ? 0 : table.rowsPerPage === 'all' ? 1 : (table.currentPage - 1) * table.rowsPerPage + 1}
                to={table.rowsPerPage === 'all' ? table.sortedVisits.length : Math.min(table.currentPage * table.rowsPerPage, table.sortedVisits.length)}
                total={table.sortedVisits.length}
                rowsPerPage={table.rowsPerPage}
                rowsPerPageOptions={[5, 10, 30, 50, 100, 'all']}
                onRowsPerPageChange={table.changeRowsPerPage}
                onPrevious={table.previousPage}
                onNext={table.nextPage}
                onPageChange={table.changePage}
            />
        </section>
    );
}
