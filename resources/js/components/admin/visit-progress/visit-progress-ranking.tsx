import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TablePlaceholderRows } from '@/components/ui/table';
import type { AdminVisitLogs } from '@/types/dashboard';
import { ArrowDown, ArrowUp, ChevronsUpDown, Funnel } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    groupLabel,
    type SortColumn,
    type SortDirection,
    type VisitorTypeFilter,
    type VisitorWithRangeVisits,
} from '../visit-logs/visit-logs-helpers';
import { VisitSearchControl } from '../visit-logs/visit-table-controls';
import { compareProgressRows, toProgressRow } from './visit-progress-ranking-utils';

interface VisitProgressRankingProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: VisitorTypeFilter;
    requiredVisits: number;
    search: string;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    filterPanel?: ReactNode;
    filters: AdminVisitLogs['filters'];
    yearLevel: string;
    section: string;
    department: string;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onSearchChange: (value: string) => void;
    onSortChange: (column: SortColumn) => void;
    onVisitorOpen: (visitor: VisitorWithRangeVisits) => void;
}

const rowsPerPageOptions: RowsPerPageOption[] = [5, 15, 30, 100, 'all'];

export function VisitProgressRanking({
    visitors,
    visitorType,
    requiredVisits,
    search,
    sortColumn,
    sortDirection,
    filterPanel,
    filters,
    yearLevel,
    section,
    department,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    onSearchChange,
    onSortChange,
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
    const rows = allRows;
    const totalPages = rowsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(rows.length / rowsPerPage));
    const visibleRows = rowsPerPage === 'all' ? rows : rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const from = rows.length === 0 ? 0 : (currentPage - 1) * (rowsPerPage === 'all' ? rows.length : rowsPerPage) + 1;
    const to = rowsPerPage === 'all' ? rows.length : Math.min(rows.length, currentPage * rowsPerPage);
    const placeholderRows = rowsPerPage === 'all' || visibleRows.length === 0 ? 0 : Math.max(0, rowsPerPage - visibleRows.length);
    const groupHeader = visitorType === 'student' ? 'Year / section' : 'Department';
    const searchPlaceholder = visitorType === 'student' ? 'Search ID, name, section' : 'Search ID, name, department';
    const complete = allRows.filter((row) => row.percent >= 100).length;
    const noVisits = allRows.filter((row) => row.visits === 0).length;
    const average = allRows.length > 0 ? Math.round(allRows.reduce((sum, row) => sum + row.percent, 0) / allRows.length) : 0;
    const yearLevelOptions = [{ value: '', label: 'All year levels' }, ...filters.yearLevels.map((level) => ({ value: level, label: level }))];
    const sectionsForYear = filters.sectionsByYearLevel[yearLevel] ?? [];
    const sectionOptions = [
        { value: '', label: 'All sections' },
        ...(yearLevel ? sectionsForYear : [...new Set(Object.values(filters.sectionsByYearLevel).flat())]).map((option) => ({
            value: option,
            label: option,
        })),
    ];
    const departmentOptions = [{ value: '', label: 'All departments' }, ...filters.departments.map((option) => ({ value: option, label: option }))];

    const handleYearLevelChange = useCallback(
        (value: string) => {
            onYearLevelChange(value);
            const sectionsForNewYear = filters.sectionsByYearLevel[value] ?? [];
            if (sectionsForNewYear.length === 1) {
                onSectionChange(sectionsForNewYear[0]);
            }
        },
        [filters.sectionsByYearLevel, onSectionChange, onYearLevelChange],
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, search, visitorType, visitors]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    return (
        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800" />
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
                <div className={`mt-4 grid gap-3 ${visitorType === 'student' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-[#030A8C]">Search</label>
                        <VisitSearchControl search={search} placeholder={searchPlaceholder} onSearchChange={onSearchChange} />
                    </div>
                    {visitorType === 'student' ? (
                        <>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-[#030A8C]">Year level</label>
                                <SearchableSelect
                                    value={yearLevel}
                                    options={yearLevelOptions}
                                    placeholder="All year levels"
                                    searchPlaceholder="Search year level"
                                    onChange={handleYearLevelChange}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-[#030A8C]">Section</label>
                                <SearchableSelect
                                    value={section}
                                    options={sectionOptions}
                                    placeholder="All sections"
                                    searchPlaceholder="Search section"
                                    disabled={!yearLevel}
                                    onChange={onSectionChange}
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-[#030A8C]">Department</label>
                            <SearchableSelect
                                value={department}
                                options={departmentOptions}
                                placeholder="All departments"
                                searchPlaceholder="Search department"
                                onChange={onDepartmentChange}
                            />
                        </div>
                    )}
                </div>
            </div>
            {filtersOpen && filterPanel}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-[#040DBF]/10 bg-[#f6f8ff] text-[#020659]/70">
                        <tr>
                            <SortableTh column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableTh column="group" label={groupHeader} sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableTh column="visitCount" label="Visits" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableTh
                                column="remaining"
                                label="Remaining"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <SortableTh
                                column="lastVisit"
                                label="Last visit"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <SortableTh column="progress" label="Progress" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
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

function SortableTh({
    column,
    label,
    sort,
    direction,
    onSortChange,
}: {
    column: SortColumn;
    label: string;
    sort: SortColumn;
    direction: SortDirection;
    onSortChange: (column: SortColumn) => void;
}) {
    const active = sort === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <th className="px-4 py-3 font-medium text-[#020659]/70">
            <button type="button" onClick={() => onSortChange(column)} className="inline-flex items-center gap-1.5 hover:text-[#010440]">
                {label}
                <Icon className="size-3.5" />
            </button>
        </th>
    );
}
