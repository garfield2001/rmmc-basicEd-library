import { Button } from '@/components/ui/button';
import { DateInput, formatDisplayDate } from '@/components/ui/date-input';
import { toIsoDate } from '@/components/ui/date-input-utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SelectInput } from '@/components/ui/select-input';
import { useEffect, useState } from 'react';
import type { VisitHistoryFilterPanelProps } from './visit-history-filter-panel-types';
import type { VisitLogStatusFilter } from './visit-history-helpers';
import { VisitSearchControl, VisitSortOptions, VisitStatusOptions } from './visit-table-controls';

export function VisitHistoryFilterPanel({
    filters,
    schoolYearName,
    schoolYearStart,
    schoolYearEnd,
    startDate,
    endDate,
    visitorType,
    yearLevel,
    section,
    department,
    search,
    logStatus = 'all',
    sortColumn,
    sortDirection,
    onStartDateChange,
    onEndDateChange,
    onResetDateCoverage,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    onSearchChange,
    onLogStatusChange,
    onQuickSortChange,
    onClearFilters,
    showVisitStatusFilter = false,
    showTableControls = true,
    framed = true,
}: VisitHistoryFilterPanelProps) {
    const [dateMode, setDateMode] = useState(startDate || endDate ? 'custom' : 'school_year');
    const today = toIsoDate(new Date());
    const maxSelectableDate = schoolYearEnd && schoolYearEnd < today ? schoolYearEnd : today;
    const sortValue = `${sortColumn}:${sortDirection}`;
    const hasFilters = Boolean(
        startDate ||
        endDate ||
        search ||
        yearLevel ||
        section ||
        department ||
        (showVisitStatusFilter && logStatus !== 'all') ||
        sortColumn !== 'lastVisit' ||
        sortDirection !== 'desc',
    );
    const groupStep = dateMode === 'custom' ? 4 : 2;
    const dateRangeLabel =
        schoolYearStart && maxSelectableDate
            ? `${formatDisplayDate(schoolYearStart)} to ${formatDisplayDate(maxSelectableDate)}`
            : 'Active school-year dates';
    const searchPlaceholder = visitorType === 'student' ? 'Search ID, name, section' : 'Search ID, name, department';
    const yearLevelOptions = [{ value: '', label: 'All year levels' }, ...filters.yearLevels.map((level) => ({ value: level, label: level }))];
    const sectionOptions = [
        { value: '', label: yearLevel ? 'All sections' : 'Choose year level first' },
        ...(filters.sectionsByYearLevel[yearLevel] ?? []).map((option) => ({ value: option, label: option })),
    ];
    const departmentOptions = [{ value: '', label: 'All departments' }, ...filters.departments.map((option) => ({ value: option, label: option }))];

    useEffect(() => {
        if (startDate || endDate) {
            setDateMode('custom');
        }
    }, [endDate, startDate]);

    const clearEverything = () => {
        setDateMode('school_year');
        onResetDateCoverage();
        onClearFilters?.();
    };

    const content = (
        <>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Filters</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">
                        {schoolYearName ?? 'Active school year'} uses {formatDisplayDate(schoolYearStart)} to {formatDisplayDate(maxSelectableDate)}{' '}
                        by default.
                    </p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled={!hasFilters} onClick={clearEverything} className="h-9">
                    Clear filters
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(12rem,0.75fr)_minmax(12rem,0.75fr)_minmax(12rem,0.75fr)_minmax(12rem,0.75fr)_minmax(12rem,0.75fr)_minmax(18rem,1.35fr)]">
                <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                    1. Start date and end date
                    <SelectInput
                        value={dateMode}
                        onChange={(event) => {
                            setDateMode(event.target.value);

                            if (event.target.value === 'school_year') {
                                onResetDateCoverage();
                            }
                        }}
                    >
                        <option value="school_year">{dateRangeLabel}</option>
                        <option value="custom">Choose custom dates</option>
                    </SelectInput>
                </label>

                {dateMode === 'custom' && (
                    <>
                        <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                            2. Start
                            <DateInput
                                value={startDate}
                                min={schoolYearStart}
                                max={endDate || maxSelectableDate}
                                focusDate={startDate || schoolYearStart}
                                onChange={onStartDateChange}
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                            3. End
                            <DateInput
                                value={endDate}
                                min={startDate || schoolYearStart}
                                max={maxSelectableDate}
                                focusDate={endDate || maxSelectableDate}
                                onChange={onEndDateChange}
                            />
                        </label>
                    </>
                )}

                {visitorType === 'student' ? (
                    <>
                        <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                            {groupStep}. Year level
                            <SearchableSelect
                                value={yearLevel}
                                options={yearLevelOptions}
                                placeholder="All year levels"
                                searchPlaceholder="Search year level"
                                onChange={onYearLevelChange}
                            />
                        </label>
                        {yearLevel && (
                            <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                                {groupStep + 1}. Section
                                <SearchableSelect
                                    value={section}
                                    options={sectionOptions}
                                    placeholder="All sections"
                                    searchPlaceholder="Search section"
                                    onChange={onSectionChange}
                                />
                            </label>
                        )}
                    </>
                ) : (
                    <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                        {groupStep}. Department
                        <SearchableSelect
                            value={department}
                            options={departmentOptions}
                            placeholder="All departments"
                            searchPlaceholder="Search department"
                            onChange={onDepartmentChange}
                        />
                    </label>
                )}

                {showTableControls && (
                    <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                        Sort
                        <SelectInput value={sortValue} onChange={(event) => onQuickSortChange(event.target.value)}>
                            <VisitSortOptions />
                        </SelectInput>
                    </label>
                )}

                {showTableControls && showVisitStatusFilter && onLogStatusChange && (
                    <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                        Requirement status
                        <SelectInput value={logStatus} onChange={(event) => onLogStatusChange(event.target.value as VisitLogStatusFilter)}>
                            <VisitStatusOptions />
                        </SelectInput>
                    </label>
                )}

                {showTableControls && <VisitSearchControl search={search} placeholder={searchPlaceholder} onSearchChange={onSearchChange} />}
            </div>
        </>
    );

    return framed ? (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">{content}</section>
    ) : (
        <div className="border-t border-[#040DBF]/10 bg-[#f6f8ff]/70 p-4">{content}</div>
    );
}
