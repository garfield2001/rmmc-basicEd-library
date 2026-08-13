import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { SelectInput } from '@/components/ui/select-input';
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

                {onOrderDirectionChange && (
                    <label className="text-sm font-medium text-[#010440]">
                        Order
                        <SelectInput
                            value={orderDirection}
                            onChange={(event) => onOrderDirectionChange(event.target.value as 'asc' | 'desc')}
                            className="mt-2"
                        >
                            <option value="asc">Ascending (A to Z)</option>
                            <option value="desc">Descending (Z to A)</option>
                        </SelectInput>
                    </label>
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

            {onOrderDirectionChange && (
                <label className="text-sm font-medium text-[#010440]">
                    Order
                    <SelectInput
                        value={orderDirection}
                        onChange={(event) => onOrderDirectionChange(event.target.value as 'asc' | 'desc')}
                        className="mt-2"
                    >
                        <option value="asc">Ascending (Kinder 1 to Grade 10)</option>
                        <option value="desc">Descending (Grade 10 to Kinder 1)</option>
                    </SelectInput>
                </label>
            )}
        </>
    );
}
