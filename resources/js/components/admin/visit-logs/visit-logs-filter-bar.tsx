import { VisitTypeTab } from '@/components/admin/visit-logs/visit-logs-ui';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SelectInput } from '@/components/ui/select-input';
import type { AdminVisitLogs } from '@/types/dashboard';
import { BriefcaseBusiness, GraduationCap, Search, X } from 'lucide-react';
import type { SortColumn, SortDirection, VisitorTypeFilter } from './visit-logs-helpers';

interface VisitLogsFilterBarProps {
    filters: AdminVisitLogs['filters'];
    metrics: AdminVisitLogs['metrics'];
    visitorType: VisitorTypeFilter;
    yearLevel: string;
    section: string;
    department: string;
    search: string;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    onVisitorTypeChange: (value: VisitorTypeFilter) => void;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onSearchChange: (value: string) => void;
    onQuickSortChange: (value: string) => void;
    onClearFilters?: () => void;
    showVisitorType?: boolean;
}

export function VisitLogsFilterBar({
    filters,
    metrics,
    visitorType,
    yearLevel,
    section,
    department,
    search,
    sortColumn,
    sortDirection,
    onVisitorTypeChange,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    onSearchChange,
    onQuickSortChange,
    onClearFilters,
    showVisitorType = true,
}: VisitLogsFilterBarProps) {
    const sortValue = `${sortColumn}:${sortDirection}`;
    const hasFilters = Boolean(search || yearLevel || section || department || sortColumn !== 'lastVisit' || sortDirection !== 'desc');
    const searchPlaceholder = visitorType === 'student' ? 'Search ID, name, section' : 'Search ID, name, department';
    const yearLevelOptions = [{ value: '', label: 'All year levels' }, ...filters.yearLevels.map((level) => ({ value: level, label: level }))];
    const sectionOptions = [
        { value: '', label: yearLevel ? 'All sections' : 'Choose year level first' },
        ...(filters.sectionsByYearLevel[yearLevel] ?? []).map((option) => ({ value: option, label: option })),
    ];
    const departmentOptions = [{ value: '', label: 'All departments' }, ...filters.departments.map((option) => ({ value: option, label: option }))];

    return (
        <div className="space-y-4 border-b border-[#040DBF]/10 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Filters</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">
                        Narrow the list by group, sort order, or search text. Blank dates use the active school-year coverage.
                    </p>
                </div>
                {onClearFilters && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        disabled={!hasFilters}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium text-[#020659] transition hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        Clear filters
                    </button>
                )}
            </div>
            {showVisitorType && (
                <div className="admin-segmented-tabs w-full sm:w-fit">
                    <VisitTypeTab
                        value="student"
                        activeValue={visitorType}
                        label="Students"
                        count={metrics.studentVisitors}
                        icon={GraduationCap}
                        onChange={onVisitorTypeChange}
                    />
                    <VisitTypeTab
                        value="employee"
                        activeValue={visitorType}
                        label="Employees"
                        count={metrics.employeeVisitors}
                        icon={BriefcaseBusiness}
                        onChange={onVisitorTypeChange}
                    />
                </div>
            )}
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(13rem,1fr)_minmax(13rem,1fr)_minmax(12rem,0.8fr)_minmax(20rem,1.6fr)]">
                {visitorType === 'student' && (
                    <>
                        <SearchableSelect
                            value={yearLevel}
                            options={yearLevelOptions}
                            placeholder="All year levels"
                            searchPlaceholder="Search year level"
                            onChange={onYearLevelChange}
                        />
                        <SearchableSelect
                            value={section}
                            options={sectionOptions}
                            placeholder={yearLevel ? 'All sections' : 'Choose year level first'}
                            searchPlaceholder="Search section"
                            disabled={!yearLevel}
                            onChange={onSectionChange}
                        />
                    </>
                )}

                {visitorType === 'employee' && (
                    <SearchableSelect
                        value={department}
                        options={departmentOptions}
                        placeholder="All departments"
                        searchPlaceholder="Search department"
                        onChange={onDepartmentChange}
                    />
                )}

                <SelectInput value={sortValue} onChange={(event) => onQuickSortChange(event.target.value)}>
                    <option value="lastVisit:desc">Newest first</option>
                    <option value="lastVisit:asc">Oldest first</option>
                    <option value="visitCount:desc">Most visits</option>
                    <option value="visitCount:asc">Fewest visits</option>
                    <option value="name:asc">Name A-Z</option>
                    <option value="name:desc">Name Z-A</option>
                </SelectInput>

                <div className="relative md:col-span-2 2xl:col-span-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                    <input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-9 pl-9 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#030A8C]/50 transition hover:bg-[#040DBF]/5 hover:text-[#010440]"
                            title="Clear search"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
