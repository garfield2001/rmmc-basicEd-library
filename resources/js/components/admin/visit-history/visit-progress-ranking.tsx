import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { toIsoDate } from '@/components/ui/date-input-utils';
import { DateRangeInput } from '@/components/ui/date-range-input';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TablePlaceholderRows } from '@/components/ui/table';
import type { AdminVisitLogs } from '@/types/dashboard';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    getAcademicDepartment,
    groupLabel,
    type SortColumn,
    type SortDirection,
    type VisitorTypeFilter,
    type VisitorWithRangeVisits,
} from './visit-logs-helpers';
import { compareProgressRows, toProgressRow } from './visit-progress-ranking-utils';
import { VisitSearchControl } from './visit-table-controls';

interface VisitProgressRankingProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: VisitorTypeFilter;
    requiredVisits: number;
    search: string;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    filters: AdminVisitLogs['filters'];
    startDate?: string;
    endDate?: string;
    schoolYearStart?: string;
    schoolYearEnd?: string;
    academicDepartment?: string;
    yearLevel?: string;
    section?: string;
    onSearchChange: (value: string) => void;
    onSortChange: (column: SortColumn) => void;
    onVisitorOpen: (visitor: VisitorWithRangeVisits) => void;
    onDateRangeChange?: (start: string, end: string) => void;
    onAcademicDepartmentChange?: (value: string) => void;
    onYearLevelChange?: (value: string) => void;
    onSectionChange?: (value: string) => void;
}

const rowsPerPageOptions: RowsPerPageOption[] = [5, 15, 30, 100, 'all'];

export function VisitProgressRanking({
    visitors,
    visitorType,
    requiredVisits,
    search,
    sortColumn,
    sortDirection,
    filters,
    startDate,
    endDate,
    schoolYearStart,
    schoolYearEnd,
    academicDepartment,
    yearLevel,
    section,
    onSearchChange,
    onSortChange,
    onVisitorOpen,
    onDateRangeChange,
    onAcademicDepartmentChange,
    onYearLevelChange,
    onSectionChange,
}: VisitProgressRankingProps) {
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
    const searchPlaceholder = visitorType === 'student' ? 'Search ID, name, section' : 'Search ID, name, department';
    const complete = allRows.filter((row) => row.percent >= 100).length;
    const noVisits = allRows.filter((row) => row.visits === 0).length;
    const average = allRows.length > 0 ? Math.round(allRows.reduce((sum, row) => sum + row.percent, 0) / allRows.length) : 0;
    const today = toIsoDate(new Date());
    const maxSelectableDate = schoolYearEnd && schoolYearEnd < today ? schoolYearEnd : today;

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, search, visitorType, visitors]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const availableSections = useMemo(() => {
        if (yearLevel) {
            return filters.sectionsByYearLevel[yearLevel] || [];
        }
        if (academicDepartment) {
            return Object.entries(filters.sectionsByYearLevel)
                .filter(([yl]) => getAcademicDepartment(yl) === academicDepartment)
                .flatMap(([, secs]) => secs);
        }
        return Object.values(filters.sectionsByYearLevel).flat();
    }, [yearLevel, academicDepartment, filters.sectionsByYearLevel]);

    return (
        <section className="flex h-full flex-col">
            <div className="border-b border-[#040DBF]/10 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Progress table</h2>
                        <p className="mt-1 text-sm text-[#020659]/70">
                            {allRows.length.toLocaleString()} tracked - {average}% average - {complete.toLocaleString()} complete -{' '}
                            {noVisits.toLocaleString()} no visits
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[200px] flex-1">
                            <label className="mb-1 block text-[11px] font-bold tracking-wider text-[#020659]/60 uppercase">Search Table</label>
                            <VisitSearchControl search={search} placeholder={searchPlaceholder} onSearchChange={onSearchChange} />
                        </div>
                        {onDateRangeChange && schoolYearStart !== undefined && (
                            <div className="w-full sm:w-64">
                                <label className="mb-1 block text-[11px] font-bold tracking-wider text-[#020659]/60 uppercase">Date Range</label>
                                <DateRangeInput
                                    startDate={startDate ?? ''}
                                    endDate={endDate ?? ''}
                                    min={schoolYearStart}
                                    max={maxSelectableDate}
                                    onChange={onDateRangeChange}
                                />
                            </div>
                        )}
                    </div>
                    {visitorType === 'student' && onAcademicDepartmentChange && (
                        <div className="flex flex-wrap gap-3 border-b border-[#040DBF]/5 pb-2">
                            <div className="max-w-[250px] min-w-[150px] flex-1">
                                <label className="mb-1 block text-[11px] font-bold tracking-wider text-[#020659]/60 uppercase">
                                    Academic Department
                                </label>
                                <SearchableSelect
                                    value={academicDepartment ?? ''}
                                    options={[
                                        { value: '', label: 'All departments' },
                                        { value: 'Pre-school', label: 'Pre-school' },
                                        { value: 'Elementary', label: 'Elementary' },
                                        { value: 'High School', label: 'High School' },
                                    ]}
                                    placeholder="All departments"
                                    onChange={onAcademicDepartmentChange}
                                />
                            </div>
                            <div className="max-w-[250px] min-w-[150px] flex-1">
                                <label className="mb-1 block text-[11px] font-bold tracking-wider text-[#020659]/60 uppercase">Year Level</label>
                                <SearchableSelect
                                    value={yearLevel ?? ''}
                                    options={[
                                        { value: '', label: 'All year levels' },
                                        ...filters.yearLevels
                                            .filter((y) => !academicDepartment || getAcademicDepartment(y) === academicDepartment)
                                            .map((y) => ({ value: y, label: y })),
                                    ]}
                                    placeholder="All year levels"
                                    onChange={onYearLevelChange!}
                                    disabled={filters.yearLevels.length === 0}
                                />
                            </div>
                            <div className="max-w-[250px] min-w-[150px] flex-1">
                                <label className="mb-1 block text-[11px] font-bold tracking-wider text-[#020659]/60 uppercase">Section</label>
                                <SearchableSelect
                                    value={section ?? ''}
                                    options={[
                                        { value: '', label: 'All sections' },
                                        ...Array.from(new Set(availableSections))
                                            .sort()
                                            .map((s) => ({ value: s, label: s })),
                                    ]}
                                    placeholder="All sections"
                                    onChange={onSectionChange!}
                                    disabled={Object.keys(filters.sectionsByYearLevel).length === 0}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-[#040DBF]/10 bg-[#f6f8ff] text-[#020659]/70">
                        <tr>
                            <SortableTh column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableTh column="visitCount" label="Visits" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableTh
                                column="lastVisit"
                                label="Last visit"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
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
                                <td className="px-4 py-3">
                                    <div className="font-medium text-[#010440]">{row.visitor.name ?? '-'}</div>
                                    <div className="mt-0.5 text-xs text-[#020659]/60">{groupLabel(row.visitor)}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="mb-1.5 font-semibold text-[#010440]">
                                        {row.visits}/{requiredVisits}
                                        {row.visits > requiredVisits && requiredVisits > 0 && (
                                            <span className="ml-1.5 text-xs font-bold text-green-600/90">(+{row.visits - requiredVisits})</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ProgressBar value={row.percent} className="w-full max-w-48 min-w-24" />
                                        <span className="text-xs font-semibold text-[#010440]">{row.percent}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-[#020659]/70">{row.lastVisit}</td>
                            </tr>
                        ))}
                        {visibleRows.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-sm text-[#020659]/70">
                                    No progress records match the selected filters.
                                </td>
                            </tr>
                        )}
                        <TablePlaceholderRows rowCount={placeholderRows} colSpan={3} />
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
