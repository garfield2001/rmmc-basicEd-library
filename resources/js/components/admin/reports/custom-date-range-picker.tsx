import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';

interface CustomDateRangePickerProps {
    startDate: string;
    endDate: string;
    min: string;
    max: string;
    onChange: (startDate: string, endDate: string) => void;
}

export function CustomDateRangePicker({ startDate, endDate, min, max, onChange }: CustomDateRangePickerProps) {
    const updateStartDate = (nextStartDate: string) => {
        onChange(nextStartDate, endDate && nextStartDate && endDate >= nextStartDate ? endDate : '');
    };

    const updateEndDate = (nextEndDate: string) => {
        onChange(startDate, nextEndDate);
    };

    return (
        <span className="mt-2 grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <DateInput value={startDate} min={min} max={max} onChange={updateStartDate} placeholder="Start date" />
            <DateInput value={endDate} min={startDate || min} max={max} onChange={updateEndDate} placeholder="End date" disabled={!startDate} />
            {(startDate || endDate) && (
                <Button type="button" variant="outline" size="sm" onClick={() => onChange('', '')} className="h-10 justify-center">
                    Clear
                </Button>
            )}
        </span>
    );
}
