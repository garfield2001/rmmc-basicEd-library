import { Button } from '@/components/ui/button';
import { formatDisplayDate } from '@/components/ui/date-input';
import { VisitLogDateRangePicker } from './visit-log-date-range-picker';

interface VisitHistoryDateRangeCardProps {
    schoolYearName?: string | null;
    schoolYearStart: string;
    schoolYearEnd: string;
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    onReset: () => void;
}

export function VisitHistoryDateRangeCard({
    schoolYearName,
    schoolYearStart,
    schoolYearEnd,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onReset,
}: VisitHistoryDateRangeCardProps) {
    const today = new Date().toISOString().slice(0, 10);

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">{schoolYearName ?? 'No active school year'}</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">
                        {schoolYearStart && schoolYearEnd
                            ? `${formatDisplayDate(schoolYearStart)} to ${formatDisplayDate(schoolYearEnd)}`
                            : 'Activate a school year to view visit logs.'}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[#030A8C]">Choose a date range from one dropdown; included days are highlighted.</p>
                </div>
                <div className="space-y-3">
                    <VisitLogDateRangePicker
                        startDate={startDate}
                        endDate={endDate || today}
                        minDate={schoolYearStart}
                        maxDate={today}
                        onStartDateChange={onStartDateChange}
                        onEndDateChange={onEndDateChange}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={onReset} className="h-10 w-full justify-center sm:w-auto">
                        Reset to school year through today
                    </Button>
                </div>
            </div>
        </section>
    );
}
