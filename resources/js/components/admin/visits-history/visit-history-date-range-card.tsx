import { Button } from '@/components/ui/button';
import { DateInput, formatDisplayDate } from '@/components/ui/date-input';

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
                            : 'Activate a school year to view visit history.'}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[#030A8C]">Choose a date range for the table and visitor visit counts.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <DateInput
                        value={startDate}
                        onChange={onStartDateChange}
                        min={schoolYearStart || undefined}
                        max={endDate || today}
                        placeholder="Start date"
                    />
                    <DateInput
                        value={endDate}
                        onChange={onEndDateChange}
                        min={startDate || schoolYearStart || undefined}
                        max={today}
                        placeholder="End date"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={onReset} className="h-10 justify-center">
                        Reset
                    </Button>
                </div>
            </div>
        </section>
    );
}
