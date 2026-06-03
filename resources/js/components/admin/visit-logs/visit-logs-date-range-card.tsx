import { Button } from '@/components/ui/button';
import { DateInput, formatDisplayDate } from '@/components/ui/date-input';
import { toIsoDate } from '@/components/ui/date-input-utils';
import { SelectInput } from '@/components/ui/select-input';
import { useEffect, useState } from 'react';

interface VisitLogsDateRangeCardProps {
    schoolYearName?: string | null;
    schoolYearStart: string;
    schoolYearEnd: string;
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    onReset: () => void;
}

export function VisitLogsDateRangeCard({
    schoolYearName,
    schoolYearStart,
    schoolYearEnd,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onReset,
}: VisitLogsDateRangeCardProps) {
    const today = toIsoDate(new Date());
    const maxSelectableDate = schoolYearEnd && schoolYearEnd < today ? schoolYearEnd : today;
    const [dateMode, setDateMode] = useState(startDate || endDate ? 'custom' : 'school_year');
    const dateRangeLabel =
        schoolYearStart && maxSelectableDate ? `${formatDisplayDate(schoolYearStart)} to ${formatDisplayDate(maxSelectableDate)}` : 'Active school-year dates';

    useEffect(() => {
        if (startDate || endDate) {
            setDateMode('custom');
        }
    }, [endDate, startDate]);

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.45fr)_auto] lg:items-end">
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">{schoolYearName ?? 'No active school year'}</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">
                        {schoolYearStart && schoolYearEnd
                            ? `${formatDisplayDate(schoolYearStart)} to ${formatDisplayDate(schoolYearEnd)}`
                            : 'Activate a school year to view visit history.'}
                    </p>
                </div>
                <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                    1. Start date and end date
                    <SelectInput
                        value={dateMode}
                        onChange={(event) => {
                            setDateMode(event.target.value);

                            if (event.target.value === 'school_year') {
                                onReset();
                            }
                        }}
                    >
                        <option value="school_year">{dateRangeLabel}</option>
                        <option value="custom">Choose custom dates</option>
                    </SelectInput>
                </label>
                {dateMode === 'custom' && (
                    <div className="flex min-w-0 flex-wrap items-end gap-2">
                        <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                            2. Start
                            <DateInput
                                value={startDate}
                                min={schoolYearStart}
                                max={endDate || maxSelectableDate}
                                focusDate={startDate || schoolYearStart}
                                onChange={onStartDateChange}
                                wrapperClassName="w-full sm:w-[11rem]"
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
                                wrapperClassName="w-full sm:w-[11rem]"
                            />
                        </label>
                        <Button type="button" variant="outline" size="sm" onClick={onReset} className="h-10 w-full justify-center sm:w-auto">
                            Clear dates
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
