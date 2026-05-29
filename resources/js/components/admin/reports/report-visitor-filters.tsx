import { SearchableSelect } from '@/components/ui/searchable-select';
import type { VisitReportOptions } from '@/types/reports';
import { allFilterValue, type VisitorTypeFilter } from './report-helpers';

interface ReportVisitorFiltersProps {
    reportOptions: VisitReportOptions;
    visitorType: VisitorTypeFilter;
    yearLevel: string;
    section: string;
    department: string;
    availableSections: string[];
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
}

export function ReportVisitorFilters({
    reportOptions,
    visitorType,
    yearLevel,
    section,
    department,
    availableSections,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
}: ReportVisitorFiltersProps) {
    if (visitorType === 'employee') {
        const departmentOptions = [
            { value: '', label: 'Select department' },
            { value: allFilterValue, label: 'All departments' },
            ...reportOptions.departments.map((option) => ({ value: option, label: option })),
        ];

        return (
            <label className="text-sm font-medium text-[#010440]">
                Department
                <SearchableSelect
                    value={department}
                    options={departmentOptions}
                    placeholder="Select department"
                    searchPlaceholder="Search department"
                    className="mt-2"
                    onChange={onDepartmentChange}
                />
            </label>
        );
    }

    if (visitorType !== 'student') {
        return null;
    }

    const yearLevelOptions = [
        { value: '', label: 'Select year level' },
        { value: allFilterValue, label: 'All year levels' },
        ...reportOptions.yearLevels.map((level) => ({ value: level, label: level })),
    ];
    const sectionOptions = [
        { value: '', label: 'Select section' },
        ...(availableSections.length > 1 ? [{ value: allFilterValue, label: 'All sections' }] : []),
        ...availableSections.map((option) => ({ value: option, label: option })),
    ];

    return (
        <>
            <label className="text-sm font-medium text-[#010440]">
                Year level
                <SearchableSelect
                    value={yearLevel}
                    options={yearLevelOptions}
                    placeholder="Select year level"
                    searchPlaceholder="Search year level"
                    className="mt-2"
                    onChange={onYearLevelChange}
                />
            </label>

            {yearLevel && yearLevel !== allFilterValue && (
                <label className="text-sm font-medium text-[#010440]">
                    Section
                    <SearchableSelect
                        value={section}
                        options={sectionOptions}
                        placeholder="Select section"
                        searchPlaceholder="Search section"
                        className="mt-2"
                        onChange={onSectionChange}
                    />
                </label>
            )}
        </>
    );
}
