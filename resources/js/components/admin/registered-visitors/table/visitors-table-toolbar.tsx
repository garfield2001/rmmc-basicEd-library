import { BarChart2, RotateCcw } from 'lucide-react';
import { FilterSelect, VisitorSearchInput, VisitorsTableTitle, VisitorTypeTabs } from './visitors-table-toolbar-controls';
import type { VisitorType } from './visitors-table-types';

interface VisitorsTableToolbarProps {
    activeType: VisitorType;
    search: string;
    yearLevel: string;
    section: string;
    department: string;
    yearLevels: string[];
    sections: string[];
    departments: string[];
    sort: string;
    showTypeTabs?: boolean;
    totalCount?: number;
    withRfidCount?: number;
    withoutRfidCount?: number;
    showBreakdown?: boolean;
    onToggleBreakdown?: () => void;
    onSearchChange: (value: string) => void;
    onTypeChange: (type: VisitorType) => void;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onSortClear: () => void;
}

export function VisitorsTableToolbar({
    activeType,
    search,
    yearLevel,
    section,
    department,
    yearLevels,
    sections,
    departments,
    sort,
    showTypeTabs = true,
    totalCount,
    withoutRfidCount,
    showBreakdown = false,
    onToggleBreakdown,
    onSearchChange,
    onTypeChange,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    onSortClear,
}: VisitorsTableToolbarProps) {
    const defaultSort = activeType === 'student' ? 'year_level' : 'created_at';

    return (
        <div className="space-y-3 border-b border-[#040DBF]/10 bg-[#f8faff] px-4 py-3 sm:px-5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <VisitorsTableTitle activeType={activeType} />

                {onToggleBreakdown && (
                    <button
                        type="button"
                        onClick={onToggleBreakdown}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                            showBreakdown
                                ? 'border-[#040DBF] bg-[#040DBF] text-white shadow-xs'
                                : 'border-[#040DBF]/15 bg-white text-[#030A8C] hover:bg-[#f6f8ff] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300'
                        }`}
                    >
                        <BarChart2 className="size-3.5" />
                        <span>{showBreakdown ? 'Hide Breakdown' : 'Cohort Breakdown'}</span>
                    </button>
                )}
            </div>

            {/* Seamless Inline Quick Stats Strip (No Cards) */}
            {totalCount !== undefined && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-y border-slate-200/70 py-2 text-xs dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <span>Total Registered:</span>
                        <span className="font-extrabold text-[#010440] dark:text-white">{totalCount.toLocaleString()}</span>
                    </div>

                    {withoutRfidCount !== undefined && withoutRfidCount > 0 && (
                        <>
                            <div className="hidden h-3 w-px bg-slate-300 sm:block dark:bg-slate-700" />
                            <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                <span>
                                    {withoutRfidCount.toLocaleString()} {activeType === 'student' ? 'students' : 'employees'} have no RFID assigned
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="space-y-3">
                <div className={`grid gap-3 lg:items-center ${showTypeTabs ? 'lg:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)]' : 'lg:grid-cols-1'}`}>
                    {showTypeTabs && <VisitorTypeTabs activeType={activeType} onTypeChange={onTypeChange} />}
                    <div className="grid min-w-0 gap-3 md:grid-cols-3">
                        <VisitorSearchInput activeType={activeType} search={search} onSearchChange={onSearchChange} />
                        {activeType === 'student' ? (
                            <>
                                <FilterSelect value={yearLevel} options={yearLevels} placeholder="All year levels" onChange={onYearLevelChange} />
                                <FilterSelect
                                    value={section}
                                    options={sections}
                                    placeholder={yearLevel ? 'All sections' : 'Choose year level first'}
                                    disabled={!yearLevel}
                                    onChange={onSectionChange}
                                />
                            </>
                        ) : (
                            <FilterSelect value={department} options={departments} placeholder="All departments" onChange={onDepartmentChange} />
                        )}
                    </div>
                </div>
                {sort !== defaultSort && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onSortClear}
                            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm sm:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            <RotateCcw className="size-4" />
                            Clear sort
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
