import { RotateCcw } from 'lucide-react';
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
    onSearchChange,
    onTypeChange,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    onSortClear,
}: VisitorsTableToolbarProps) {
    const defaultSort = activeType === 'student' ? 'year_level' : 'created_at';

    return (
        <div className="space-y-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-5">
            <VisitorsTableTitle activeType={activeType} />
            <div className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)] lg:items-center">
                    <VisitorTypeTabs activeType={activeType} onTypeChange={onTypeChange} />
                    {activeType === 'student' ? (
                        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                            <FilterSelect value={yearLevel} options={yearLevels} placeholder="All year levels" onChange={onYearLevelChange} />
                            <FilterSelect
                                value={section}
                                options={sections}
                                placeholder={yearLevel ? 'All sections' : 'Choose year level first'}
                                disabled={!yearLevel}
                                onChange={onSectionChange}
                            />
                        </div>
                    ) : (
                        <div className="min-w-0">
                            <FilterSelect value={department} options={departments} placeholder="Select department" onChange={onDepartmentChange} />
                        </div>
                    )}
                </div>
                <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <VisitorSearchInput activeType={activeType} search={search} onSearchChange={onSearchChange} />
                    {sort !== defaultSort && (
                        <button
                            type="button"
                            onClick={onSortClear}
                            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm sm:w-auto"
                        >
                            <RotateCcw className="size-4" />
                            Clear sort
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
