import { SortableHead } from '@/components/admin/visit-logs/visit-logs-ui';
import { formatDisplayDate } from '@/components/ui/date-input';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableHeader, TablePlaceholderRows, TableRow } from '@/components/ui/table';
import type { AdminVisitLogs } from '@/types/dashboard';
import { Funnel } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import type { SortColumn, SortDirection, VisitLogStatusFilter, VisitorWithRangeVisits } from './visit-logs-helpers';
import { VisitLogsEmptyRow, VisitLogsTableRow } from './visit-logs-table-rows';
import { VisitSearchControl } from './visit-table-controls';

interface VisitLogsTableProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: 'student' | 'employee';
    totalVisitors: number;
    startDate: string;
    endDate: string;
    requiredVisits: number;
    currentPage: number;
    totalPages: number;
    rowsPerPage: RowsPerPageOption;
    activeVisitorCount: number;
    search: string;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    selectedVisitorId?: number | null;
    filterPanel?: ReactNode;
    filters: AdminVisitLogs['filters'];
    yearLevel: string;
    section: string;
    department: string;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onSortChange: (column: SortColumn) => void;
    onSearchChange: (value: string) => void;
    onRowsPerPageChange: (rows: RowsPerPageOption) => void;
    onPrevious: () => void;
    onNext: () => void;
    onPageChange: (page: number) => void;
    onVisitorOpen: (visitor: VisitorWithRangeVisits) => void;
}

export function VisitLogsTable({
    visitors,
    visitorType,
    totalVisitors,
    startDate,
    endDate,
    requiredVisits,
    currentPage,
    totalPages,
    rowsPerPage,
    activeVisitorCount,
    search,
    sortColumn,
    sortDirection,
    selectedVisitorId,
    filterPanel,
    filters,
    yearLevel,
    section,
    department,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    onSortChange,
    onSearchChange,
    onRowsPerPageChange,
    onPrevious,
    onNext,
    onPageChange,
    onVisitorOpen,
}: VisitLogsTableProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const groupHeader = visitorType === 'student' ? 'Year / section' : 'Department';
    const searchPlaceholder = visitorType === 'student' ? 'Search ID, name, section' : 'Search ID, name, department';
    const placeholderRows = rowsPerPage === 'all' || visitors.length === 0 ? 0 : Math.max(0, rowsPerPage - visitors.length);
    const yearLevelOptions = [{ value: '', label: 'All year levels' }, ...filters.yearLevels.map((level) => ({ value: level, label: level }))];
    const sectionsForYear = filters.sectionsByYearLevel[yearLevel] ?? [];
    const sectionOptions = [
        { value: '', label: 'All sections' },
        ...(yearLevel ? sectionsForYear : [...new Set(Object.values(filters.sectionsByYearLevel).flat())]).map((option) => ({ value: option, label: option })),
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

    return (
        <>
            <div className="border-b border-[#040DBF]/10 px-5 py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Visitor log records</h2>
                        <p className="mt-1 text-sm text-[#020659]/70">
                            Showing {totalVisitors.toLocaleString()} visitor{totalVisitors === 1 ? '' : 's'} from {formatDisplayDate(startDate)} to{' '}
                            {formatDisplayDate(endDate)}. {activeVisitorCount.toLocaleString()} had visits in this coverage.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((current) => !current)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-semibold text-[#030A8C] transition hover:border-[#040DBF]/25 hover:bg-[#f6f8ff]"
                        aria-expanded={filtersOpen}
                    >
                        <Funnel className="size-4" />
                        Filters
                    </button>
                </div>
                {filtersOpen && filterPanel}
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
            <div className="overflow-x-auto">
                <Table className="w-full min-w-205">
                    <TableHeader className="bg-[#f6f8ff]">
                        <TableRow>
                            <SortableHead column="schoolId" label="ID" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableHead column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={onSortChange} />
                            <SortableHead
                                column="group"
                                label={groupHeader}
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <SortableHead
                                column="visitCount"
                                label="Visits"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                            <SortableHead
                                column="lastVisit"
                                label="Last visit"
                                sort={sortColumn}
                                direction={sortDirection}
                                onSortChange={onSortChange}
                            />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visitors.length > 0 ? (
                            <>
                                {visitors.map((visitor) => (
                                    <VisitLogsTableRow
                                        key={visitor.id}
                                        visitor={visitor}
                                        requiredVisits={requiredVisits}
                                        selected={selectedVisitorId === visitor.id}
                                        onOpen={onVisitorOpen}
                                    />
                                ))}
                                <TablePlaceholderRows rowCount={placeholderRows} colSpan={5} />
                            </>
                        ) : (
                            <VisitLogsEmptyRow />
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                from={totalVisitors === 0 ? 0 : rowsPerPage === 'all' ? 1 : (currentPage - 1) * rowsPerPage + 1}
                to={rowsPerPage === 'all' ? totalVisitors : Math.min(currentPage * rowsPerPage, totalVisitors)}
                total={totalVisitors}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 30, 50, 100, 'all']}
                onRowsPerPageChange={onRowsPerPageChange}
                onPrevious={onPrevious}
                onNext={onNext}
                onPageChange={onPageChange}
            />
        </>
    );
}
