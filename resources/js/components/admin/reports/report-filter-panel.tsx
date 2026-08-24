import { formatDisplayDate } from '@/components/ui/date-input';
import { SingleSelectDropdown } from '@/components/ui/single-select-dropdown';
import type { VisitReportOptions, VisitReportSchoolYear } from '@/types/reports';
import { RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
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
    onApplyDatePreset?: (preset: 'school_year' | 'this_month' | 'last_30_days') => void;
    onResetFilters?: () => void;
}

const visitorTypeOptions = [
    { value: 'student', label: 'Students' },
    { value: 'employee', label: 'Employees' },
];

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
    onResetFilters,
}: ReportFilterPanelProps) {
    const schoolYearDateLabel = schoolYearBounds ? `${formatDisplayDate(schoolYearBounds.start)} to ${formatDisplayDate(schoolYearBounds.end)}` : '';

    const schoolYearOptions = useMemo(
        () =>
            reportOptions.schoolYears.map((sy) => ({
                value: String(sy.id),
                label: `${sy.name}${sy.is_active ? ' (active)' : ''}`,
            })),
        [reportOptions.schoolYears],
    );

    const dateRangeOptions = useMemo(
        () => [
            { value: 'school_year', label: schoolYearDateLabel },
            { value: 'this_month', label: 'This month' },
            { value: 'last_30_days', label: 'Last 30 days' },
            { value: 'custom', label: 'Custom date range...' },
        ],
        [schoolYearDateLabel],
    );

    return (
        <section className="admin-surface space-y-3.5 rounded-xl border border-[#040DBF]/10 bg-white/95 p-4 shadow-sm sm:p-5">
            {/* Auto-flowing Responsive Filter Toolbar with Uniform Element Dimensions */}
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                <div className="flex w-full min-w-0 flex-col gap-1.5">
                    <label className="flex h-4 items-center truncate text-xs leading-4 font-semibold text-[#010440]">1. School year</label>
                    <SingleSelectDropdown
                        value={schoolYearId}
                        options={schoolYearOptions}
                        placeholder="Select school year"
                        onChange={onSchoolYearChange}
                    />
                </div>

                {selectedSchoolYear && (
                    <div className="flex w-full min-w-0 flex-col gap-1.5">
                        <label className="flex h-4 items-center truncate text-xs leading-4 font-semibold text-[#010440]">2. Date range</label>
                        <SingleSelectDropdown
                            value={dateRangeMode}
                            options={dateRangeOptions}
                            placeholder="Select date range"
                            onChange={(val) => onDateRangeModeChange(val as DateRangeMode)}
                        />
                    </div>
                )}

                {selectedSchoolYear && dateRangeMode === 'custom' && schoolYearBounds && (
                    <div className="flex w-full min-w-0 flex-col gap-1.5">
                        <label className="flex h-4 items-center truncate text-xs leading-4 font-semibold text-[#010440]">3. Custom dates</label>
                        <CustomDateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            min={schoolYearBounds.start}
                            max={schoolYearBounds.end}
                            onChange={onCustomDateRangeChange}
                        />
                    </div>
                )}

                {dateRangeIsValid && showVisitorTypeSelector && (
                    <div className="flex w-full min-w-0 flex-col gap-1.5">
                        <label className="flex h-4 items-center truncate text-xs leading-4 font-semibold text-[#010440]">
                            {dateRangeMode === 'custom' ? '4.' : '3.'} Visitors
                        </label>
                        <SingleSelectDropdown
                            value={visitorType}
                            options={visitorTypeOptions}
                            placeholder="Select visitors"
                            onChange={(val) => onVisitorTypeChange(val as VisitorTypeFilter)}
                        />
                    </div>
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

            {/* Status Footer Banner with Period Summary & Reset Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3.5 py-2 text-xs text-[#020659]/75">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#010440]">Period:</span>
                    <span>{dateRangeSummary}</span>
                    {yearLevels.length > 0 && visitorType === 'student' && (
                        <span className="text-[#020659]/60">
                            • {yearLevels.length} year levels • {sections.length} sections
                        </span>
                    )}
                </div>

                {onResetFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="inline-flex items-center gap-1 font-semibold text-[#040DBF] hover:underline"
                    >
                        <RotateCcw className="size-3" />
                        <span>Reset filters</span>
                    </button>
                )}
            </div>
        </section>
    );
}
