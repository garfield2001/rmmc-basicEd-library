import { SelectInput } from '@/components/ui/select-input';
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
        return (
            <label className="text-sm font-medium text-[#010440]">
                Department
                <SelectInput value={department} onChange={(event) => onDepartmentChange(event.target.value)} className="mt-2">
                    <option value="">Select department</option>
                    <option value={allFilterValue}>All departments</option>
                    {reportOptions.departments.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </SelectInput>
            </label>
        );
    }

    if (visitorType !== 'student') {
        return null;
    }

    return (
        <>
            <label className="text-sm font-medium text-[#010440]">
                Year level
                <SelectInput value={yearLevel} onChange={(event) => onYearLevelChange(event.target.value)} className="mt-2">
                    <option value="">Select year level</option>
                    <option value={allFilterValue}>All year levels</option>
                    {reportOptions.yearLevels.map((level) => (
                        <option key={level} value={level}>
                            {level}
                        </option>
                    ))}
                </SelectInput>
            </label>

            {yearLevel && yearLevel !== allFilterValue && (
                <label className="text-sm font-medium text-[#010440]">
                    Section
                    <SelectInput value={section} onChange={(event) => onSectionChange(event.target.value)} className="mt-2">
                        <option value="">Select section</option>
                        {availableSections.length > 1 && <option value={allFilterValue}>All sections</option>}
                        {availableSections.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </SelectInput>
                </label>
            )}
        </>
    );
}
