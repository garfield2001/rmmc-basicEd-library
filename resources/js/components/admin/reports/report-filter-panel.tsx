import { formatDisplayDate } from '@/components/ui/date-input';
import { SelectInput } from '@/components/ui/select-input';
import type { VisitReportOptions, VisitReportSchoolYear } from '@/types/reports';
import { CustomDateRangePicker } from './custom-date-range-picker';
import { type DateRangeMode, type SchoolYearBounds, type VisitorTypeFilter } from './report-helpers';
import { ReportVisitorFilters } from './report-visitor-filters';

interface ReportFilterPanelProps {
    reportOptions: VisitReportOptions;
    schoolYearId: string;
    selectedSchoolYear: VisitReportSchoolYear | null;
    schoolYearBounds: SchoolYearBounds | null;
    dateRangeMode: DateRangeMode;
    startDate: string;
    endDate: string;
    visitorType: VisitorTypeFilter;
    yearLevels: string[];
    sections: string[];
    departments: string[];
    orderDirection?: 'asc' | 'desc';
    availableSections: Array<{ value: string; label: string }>;
    showVisitorTypeSelector?: boolean;
    dateRangeIsValid: boolean;
    dateRangeSummary: string;
    onSchoolYearChange: (value: string) => void;
    onDateRangeModeChange: (value: DateRangeMode) => void;
    onCustomDateRangeChange: (startDate: string, endDate: string) => void;
    onVisitorTypeChange: (value: VisitorTypeFilter) => void;
    onYearLevelsChange: (value: string[]) => void;
    onSectionsChange: (value: string[]) => void;
    onDepartmentsChange: (value: string[]) => void;
    onOrderDirectionChange?: (value: 'asc' | 'desc') => void;
}

export function ReportFilterPanel({
    reportOptions,
    schoolYearId,
    selectedSchoolYear,
    schoolYearBounds,
    dateRangeMode,
    startDate,
    endDate,
    visitorType,
    yearLevels,
    sections,
    departments,
    orderDirection,
    availableSections,
    showVisitorTypeSelector = true,
    dateRangeIsValid,
    dateRangeSummary,
    onSchoolYearChange,
    onDateRangeModeChange,
    onCustomDateRangeChange,
    onVisitorTypeChange,
    onYearLevelsChange,
    onSectionsChange,
    onDepartmentsChange,
    onOrderDirectionChange,
}: ReportFilterPanelProps) {
    const schoolYearDateLabel = schoolYearBounds ? `${formatDisplayDate(schoolYearBounds.start)} to ${formatDisplayDate(schoolYearBounds.end)}` : '';

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[minmax(11rem,0.8fr)_minmax(12rem,0.85fr)_minmax(24rem,1.35fr)]">
                <label className="text-sm font-medium text-[#010440]">
                    1. School year
                    <SelectInput value={schoolYearId} onChange={(event) => onSchoolYearChange(event.target.value)} className="mt-2">
                        <option value="">Select school year</option>
                        {reportOptions.schoolYears.map((schoolYear) => (
                            <option key={schoolYear.id} value={schoolYear.id}>
                                {schoolYear.name}
                                {schoolYear.is_active ? ' (active)' : ''}
                            </option>
                        ))}
                    </SelectInput>
                </label>

                {selectedSchoolYear && (
                    <label className="text-sm font-medium text-[#010440]">
                        2. Start date and end date
                        <SelectInput
                            value={dateRangeMode}
                            onChange={(event) => onDateRangeModeChange(event.target.value as DateRangeMode)}
                            className="mt-2"
                        >
                            <option value="">Select start and end date</option>
                            <option value="school_year">{schoolYearDateLabel}</option>
                            <option value="custom">Choose custom dates</option>
                        </SelectInput>
                    </label>
                )}

                {selectedSchoolYear && dateRangeMode === 'custom' && schoolYearBounds && (
                    <label className="text-sm font-medium text-[#010440]">
                        3. Custom dates
                        <CustomDateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            min={schoolYearBounds.start}
                            max={schoolYearBounds.end}
                            onChange={onCustomDateRangeChange}
                        />
                    </label>
                )}

                {dateRangeIsValid && showVisitorTypeSelector && (
                    <label className="text-sm font-medium text-[#010440]">
                        {dateRangeMode === 'custom' ? '4.' : '3.'} Visitors
                        <SelectInput
                            value={visitorType}
                            onChange={(event) => onVisitorTypeChange(event.target.value as VisitorTypeFilter)}
                            className="mt-2"
                        >
                            <option value="">Select visitors</option>
                            <option value="student">Students</option>
                            <option value="employee">Employees</option>
                        </SelectInput>
                    </label>
                )}

                {dateRangeIsValid && visitorType && (
                    <ReportVisitorFilters
                        reportOptions={reportOptions}
                        visitorType={visitorType}
                        yearLevels={yearLevels}
                        sections={sections}
                        departments={departments}
                        orderDirection={orderDirection}
                        availableSections={availableSections}
                        onYearLevelsChange={onYearLevelsChange}
                        onSectionsChange={onSectionsChange}
                        onDepartmentsChange={onDepartmentsChange}
                        onOrderDirectionChange={onOrderDirectionChange}
                    />
                )}
            </div>

            <div className="mt-4 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-4 py-3 text-sm text-[#020659]/75">
                <span className="font-medium text-[#010440]">Selected period:</span> {dateRangeSummary}
                {schoolYearBounds && (
                    <span className="block pt-1">
                        Available dates stay inside {formatDisplayDate(schoolYearBounds.start)} to {formatDisplayDate(schoolYearBounds.end)}.
                    </span>
                )}
            </div>
        </section>
    );
}
