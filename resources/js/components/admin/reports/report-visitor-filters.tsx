import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import type { VisitReportOptions } from '@/types/reports';
import { type VisitorTypeFilter } from './report-helpers';

interface ReportVisitorFiltersProps {
    reportOptions: VisitReportOptions;
    visitorType: VisitorTypeFilter;
    yearLevels: string[];
    sections: string[];
    departments: string[];
    orderDirection?: 'asc' | 'desc';
    availableSections: Array<{ value: string; label: string }>;
    onYearLevelsChange: (value: string[]) => void;
    onSectionsChange: (value: string[]) => void;
    onDepartmentsChange: (value: string[]) => void;
    onOrderDirectionChange?: (value: 'asc' | 'desc') => void;
}

const employeeOrderOptions = [
    { value: 'asc', label: 'Ascending (A to Z)' },
    { value: 'desc', label: 'Descending (Z to A)' },
];

const studentOrderOptions = [
    { value: 'asc', label: 'Ascending (Kinder 1 to Grade 10)' },
    { value: 'desc', label: 'Descending (Grade 10 to Kinder 1)' },
];

export function ReportVisitorFilters({
    reportOptions,
    visitorType,
    yearLevels,
    sections,
    departments,
    orderDirection = 'asc',
    availableSections,
    onYearLevelsChange,
    onSectionsChange,
    onDepartmentsChange,
    onOrderDirectionChange,
}: ReportVisitorFiltersProps) {
    if (visitorType === 'employee') {
        return (
            <>
                <MultiSelectDropdown
                    label="Departments"
                    placeholder="Select departments"
                    values={departments}
                    options={reportOptions.departments.map((department) => ({ value: department, label: department }))}
                    onChange={onDepartmentsChange}
                />

                {departments.length > 0 && onOrderDirectionChange && (
                    <div className="flex w-full min-w-0 flex-col gap-1.5">
                        <label className="flex h-4 items-center truncate text-xs leading-4 font-semibold text-[#010440]">Order</label>
                        <SingleSelectDropdown
                            value={orderDirection}
                            options={employeeOrderOptions}
                            onChange={(val) => onOrderDirectionChange(val as 'asc' | 'desc')}
                        />
                    </div>
                )}
            </>
        );
    }

    if (visitorType !== 'student') {
        return null;
    }

    return (
        <>
            <MultiSelectDropdown
                label="Year levels"
                placeholder="Select year levels"
                values={yearLevels}
                options={reportOptions.yearLevels.map((level) => ({ value: level, label: level }))}
                onChange={onYearLevelsChange}
            />

            {yearLevels.length > 0 && (
                <MultiSelectDropdown
                    label="Sections"
                    placeholder="All sections in selected year levels"
                    values={sections}
                    options={availableSections}
                    onChange={onSectionsChange}
                    emptySelectionLabel="All selected year-level sections"
                />
            )}

            {yearLevels.length > 0 && onOrderDirectionChange && (
                <div className="flex w-full min-w-0 flex-col gap-1.5">
                    <label className="flex h-4 items-center truncate text-xs leading-4 font-semibold text-[#010440]">Order</label>
                    <SingleSelectDropdown
                        value={orderDirection}
                        options={studentOrderOptions}
                        onChange={(val) => onOrderDirectionChange(val as 'asc' | 'desc')}
                    />
                </div>
            )}
        </>
    );
}
