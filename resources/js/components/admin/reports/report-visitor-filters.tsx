import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import type { VisitReportOptions } from '@/types/reports';
import { type VisitorTypeFilter } from './report-helpers';

interface ReportVisitorFiltersProps {
    reportOptions: VisitReportOptions;
    visitorType: VisitorTypeFilter;
    yearLevels: string[];
    sections: string[];
    departments: string[];
    availableSections: Array<{ value: string; label: string }>;
    onYearLevelsChange: (value: string[]) => void;
    onSectionsChange: (value: string[]) => void;
    onDepartmentsChange: (value: string[]) => void;
}

export function ReportVisitorFilters({
    reportOptions,
    visitorType,
    yearLevels,
    sections,
    departments,
    availableSections,
    onYearLevelsChange,
    onSectionsChange,
    onDepartmentsChange,
}: ReportVisitorFiltersProps) {
    if (visitorType === 'employee') {
        return (
            <MultiSelectDropdown
                label="Departments"
                placeholder="Select departments"
                values={departments}
                options={reportOptions.departments.map((department) => ({ value: department, label: department }))}
                onChange={onDepartmentsChange}
            />
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
        </>
    );
}
