import { Button } from '@/components/ui/button';
import { DateInput, formatDisplayDate } from '@/components/ui/date-input';
import { toIsoDate } from '@/components/ui/date-input-utils';
import { SelectInput } from '@/components/ui/select-input';
import { useEffect, useState } from 'react';
import type { VisitLogsFilterPanelProps } from './visit-logs-filter-panel-types';

export function VisitLogsFilterPanel({
    schoolYearName,
    schoolYearStart,
    schoolYearEnd,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onResetDateCoverage,
    onClearFilters,
    framed = true,
}: VisitLogsFilterPanelProps) {
    const [dateMode, setDateMode] = useState(startDate || endDate ? 'custom' : 'school_year');
    const today = toIsoDate(new Date());
    const maxSelectableDate = schoolYearEnd && schoolYearEnd < today ? schoolYearEnd : today;
    const hasFilters = Boolean(startDate || endDate);
    const dateRangeLabel =
        schoolYearStart && maxSelectableDate
            ? `${formatDisplayDate(schoolYearStart)} to ${formatDisplayDate(maxSelectableDate)}`
            : 'Active school-year dates';

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
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Date Coverage</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">
                        {schoolYearName ?? 'Active school year'} uses {formatDisplayDate(schoolYearStart)} to {formatDisplayDate(maxSelectableDate)}{' '}
                        by default.
                    </p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled={!hasFilters} onClick={clearEverything} className="h-9">
                    Reset to school year
                </Button>
            </div>

            <div className={`grid gap-3 ${dateMode === 'custom' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                    1. Date range
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
            </div>
        </>
    );

    return framed ? (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">{content}</section>
    ) : (
        <div className="border-t border-[#040DBF]/10 bg-[#f6f8ff]/70 p-4">{content}</div>
    );
}
