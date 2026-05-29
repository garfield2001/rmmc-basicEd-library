import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { SelectInput } from '@/components/ui/select-input';
import { TablePlaceholderRows } from '@/components/ui/table';
import { Funnel } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
    groupLabel,
    type SortColumn,
    type SortDirection,
    type VisitorTypeFilter,
    type VisitorWithRangeVisits,
} from '../visits-history/visit-history-helpers';
import { VisitSearchControl, VisitSortOptions } from '../visits-history/visit-table-controls';
import { matchesProgressStatus, type ProgressStatusFilter } from './visit-progress-helpers';
import { compareProgressRows, toProgressRow } from './visit-progress-ranking-utils';

interface VisitProgressRankingProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: VisitorTypeFilter;
    requiredVisits: number;
    search: string;
    statusFilter: ProgressStatusFilter;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    filterPanel?: ReactNode;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: ProgressStatusFilter) => void;
    onQuickSortChange: (value: string) => void;
    onVisitorOpen: (visitor: VisitorWithRangeVisits) => void;
}

const rowsPerPageOptions: RowsPerPageOption[] = [5, 15, 30, 100, 'all'];

export function VisitProgressRanking({
    visitors,
    visitorType,
    requiredVisits,
    search,
    statusFilter,
    sortColumn,
    sortDirection,
    filterPanel,
    onSearchChange,
    onStatusFilterChange,
    onQuickSortChange,
    onVisitorOpen,
}: VisitProgressRankingProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageOption>(5);
    const allRows = useMemo(
        () =>
            visitors
                .filter((visitor) => visitor.type === visitorType)
                .map((visitor) => toProgressRow(visitor, requiredVisits))
                .sort((first, second) => compareProgressRows(first, second, sortColumn, sortDirection)),
        [requiredVisits, sortColumn, sortDirection, visitorType, visitors],
    );
    const rows = useMemo(
        () => allRows.filter((row) => matchesProgressStatus(row.visitor, requiredVisits, statusFilter)),
        [allRows, requiredVisits, statusFilter],
    );
    const totalPages = rowsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(rows.length / rowsPerPage));
    const visibleRows = rowsPerPage === 'all' ? rows : rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const from = rows.length === 0 ? 0 : (currentPage - 1) * (rowsPerPage === 'all' ? rows.length : rowsPerPage) + 1;
    const to = rowsPerPage === 'all' ? rows.length : Math.min(rows.length, currentPage * rowsPerPage);
    const placeholderRows = rowsPerPage === 'all' || visibleRows.length === 0 ? 0 : Math.max(0, rowsPerPage - visibleRows.length);
    const groupHeader = visitorType === 'student' ? 'Year / section' : 'Department';
    const searchPlaceholder = visitorType === 'student' ? 'Search ID, name, section' : 'Search ID, name, department';
    const sortValue = `${sortColumn}:${sortDirection}`;
    const complete = allRows.filter((row) => row.percent >= 100).length;
    const noVisits = allRows.filter((row) => row.visits === 0).length;
    const average = allRows.length > 0 ? Math.round(allRows.reduce((sum, row) => sum + row.percent, 0) / allRows.length) : 0;

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, search, statusFilter, visitorType, visitors]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    return (
        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
            <div className="border-b border-[#040DBF]/10 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Progress table</h2>
                        <p className="mt-1 text-sm text-[#020659]/70">
                            {allRows.length.toLocaleString()} tracked - {average}% average - {complete.toLocaleString()} complete -{' '}
                            {noVisits.toLocaleString()} no visits
                        </p>
                    </div>
                    {filterPanel && (
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((current) => !current)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-semibold text-[#030A8C] transition hover:border-[#040DBF]/25 hover:bg-[#f6f8ff]"
                            aria-expanded={filtersOpen}
                        >
                            <Funnel className="size-4" />
                            Filters
                        </button>
                    )}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-[minmax(14rem,20rem)_12rem_12rem]">
                    <VisitSearchControl search={search} placeholder={searchPlaceholder} className="" onSearchChange={onSearchChange} />
                    <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                        Sort
                        <SelectInput value={sortValue} onChange={(event) => onQuickSortChange(event.target.value)}>
                            <VisitSortOptions />
                        </SelectInput>
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                        Progress
                        <SelectInput value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as ProgressStatusFilter)}>
                            <option value="all">All progress</option>
                            <option value="in-progress">In progress</option>
                            <option value="complete">Complete</option>
                            <option value="no-visits">No visits</option>
                        </SelectInput>
                    </label>
                </div>
            </div>
            {filtersOpen && filterPanel}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-[#040DBF]/10 bg-[#f6f8ff] text-[#020659]/70">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">{groupHeader}</th>
                            <th className="px-4 py-3">Visits</th>
                            <th className="px-4 py-3">Remaining</th>
                            <th className="px-4 py-3">Last visit</th>
                            <th className="px-4 py-3">Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.map((row) => (
                            <tr
                                key={row.visitor.id}
                                tabIndex={0}
                                onClick={() => onVisitorOpen(row.visitor)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        onVisitorOpen(row.visitor);
                                    }
                                }}
                                className="cursor-pointer border-b border-[#040DBF]/5 last:border-0 hover:bg-[#f6f8ff] focus-visible:bg-[#f6f8ff] focus-visible:outline-none"
                            >
                                <td className="px-4 py-3 font-medium text-[#010440]">{row.visitor.name ?? '-'}</td>
                                <td className="px-4 py-3 text-[#020659]/70">{groupLabel(row.visitor)}</td>
                                <td className="px-4 py-3 font-semibold text-[#010440]">
                                    {row.visits}/{requiredVisits}
                                </td>
                                <td className="px-4 py-3 text-[#020659]/70">{row.remaining}</td>
                                <td className="px-4 py-3 text-[#020659]/70">{row.lastVisit}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <ProgressBar value={row.percent} className="min-w-32 flex-1" />
                                        <span className="w-12 text-right font-semibold text-[#010440]">{row.percent}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {visibleRows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#020659]/70">
                                    No progress records match the selected filters.
                                </td>
                            </tr>
                        )}
                        <TablePlaceholderRows rowCount={placeholderRows} colSpan={6} />
                    </tbody>
                </table>
            </div>
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                from={from}
                to={to}
                total={rows.length}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                onRowsPerPageChange={setRowsPerPage}
                onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
                onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                onPageChange={(page) => setCurrentPage(Math.min(totalPages, Math.max(1, page)))}
            />
        </section>
    );
}
