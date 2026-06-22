import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHeader, TablePlaceholderRows, TableRow } from '@/components/ui/table';
import type { VisitReportRow } from '@/types/reports';
import { RotateCcw } from 'lucide-react';
import { ReportExportActions } from './report-export-actions';
import { rowsPerPage, type ReportSortColumn, type SortDirection, type VisitorType } from './report-helpers';
import { ReportRow, ReportSortableHead } from './report-table-parts';

interface ReportExportUrls {
    excelUrl: string;
    wordUrl: string;
    pdfUrl: string;
    printUrl: string;
    csvUrl: string;
}

interface ReportResultsTableProps {
    visitorType: VisitorType;
    requiredVisits: number;
    exportUrls: ReportExportUrls;
    sortColumn: ReportSortColumn | null;
    sortDirection: SortDirection;
    visibleRows: VisitReportRow[];
    currentPage: number;
    totalPages: number;
    fromRow: number;
    toRow: number;
    totalRows: number;
    onSortChange: (column: ReportSortColumn) => void;
    onClearSort: () => void;
    onPageChange: (page: number) => void;
}

export function ReportResultsTable({
    visitorType,
    requiredVisits,
    exportUrls,
    sortColumn,
    sortDirection,
    visibleRows,
    currentPage,
    totalPages,
    fromRow,
    toRow,
    totalRows,
    onSortChange,
    onClearSort,
    onPageChange,
}: ReportResultsTableProps) {
    const placeholderRows = visibleRows.length > 0 ? Math.max(0, rowsPerPage - visibleRows.length) : 0;

    return (
        <section className="admin-surface overflow-hidden rounded-xl border border-[#040DBF]/10 bg-white/95 shadow-sm">
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800" />
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#040DBF]/10 bg-[#f6f8ff] px-5 py-3">
                <ReportExportActions {...exportUrls} />
                {sortColumn && (
                    <Button type="button" variant="outline" size="sm" onClick={onClearSort}>
                        <RotateCcw className="size-4" />
                        Clear sort
                    </Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <Table className="min-w-180">
                    <TableHeader className="bg-[#f6f8ff]">
                        <TableRow>
                            <ReportSortableHead
                                column="school_id"
                                label="School ID"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <ReportSortableHead column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <ReportSortableHead
                                column="group"
                                label={visitorType === 'student' ? 'Year/section' : 'Department'}
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <ReportSortableHead
                                column="visit_count"
                                label="Visits"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <ReportSortableHead
                                column="progress_percent"
                                label="Progress"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleRows.length > 0 ? (
                            <>
                                {visibleRows.map((row) => (
                                    <ReportRow key={row.id} row={row} visitorType={visitorType} requiredVisits={requiredVisits} />
                                ))}
                                <TablePlaceholderRows rowCount={placeholderRows} colSpan={5} />
                            </>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-sm text-[#020659]/65">
                                    No matching records.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                from={fromRow}
                to={toRow}
                total={totalRows}
                onPrevious={() => onPageChange(currentPage - 1)}
                onNext={() => onPageChange(currentPage + 1)}
                onPageChange={onPageChange}
            />
        </section>
    );
}
