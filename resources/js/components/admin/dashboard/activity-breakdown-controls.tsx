import { DateInput } from '@/components/ui/date-input';
import { activityDefaultLimit, activityPanelDetails, activityPanelOrder, type ActivityPanel } from './activity-breakdown-helpers';

interface ActivityBreakdownControlsProps {
    active: ActivityPanel;
    days: number;
    fromDate: string;
    minDate?: string;
    maxDate?: string;
    onPanelChange: (panel: ActivityPanel) => void;
    onDaysChange: (days: number) => void;
    onFromDateChange: (value: string) => void;
    onClear: () => void;
}

export function ActivityBreakdownControls({
    active,
    days,
    fromDate,
    minDate,
    maxDate,
    onPanelChange,
    onDaysChange,
    onFromDateChange,
    onClear,
}: ActivityBreakdownControlsProps) {
    return (
        <div className="grid w-full gap-3 min-[1180px]:grid-cols-[max-content_minmax(0,1fr)] min-[1180px]:items-start">
            <div className="admin-segmented-tabs w-full max-w-[24rem] flex-nowrap">
                {activityPanelOrder.map((panel) => (
                    <button
                        key={panel}
                        type="button"
                        onClick={() => onPanelChange(panel)}
                        className={`admin-segmented-tab whitespace-nowrap ${active === panel ? 'admin-segmented-tab-active' : ''}`}
                    >
                        {activityPanelDetails[panel].label}
                    </button>
                ))}
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="admin-segmented-tabs max-w-full flex-nowrap overflow-x-auto">
                    {[7, 14, 30].map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onDaysChange(option)}
                            className={`admin-segmented-tab rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                                !fromDate && days === option ? 'admin-segmented-tab-active' : 'text-[#020659]/75 hover:bg-white hover:text-[#010440]'
                            }`}
                        >
                            {option} days
                        </button>
                    ))}
                </div>
                <div className="grid w-full min-w-0 gap-2 sm:ml-auto sm:w-auto sm:grid-cols-[8rem_minmax(10.5rem,11rem)_auto]">
                    <input
                        type="number"
                        min={1}
                        max={366}
                        value={days}
                        onChange={(event) => onDaysChange(Number(event.target.value) || 1)}
                        className="h-10 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-semibold text-[#020659] outline-none transition focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                        aria-label="Manual number of days ending today"
                    />
                    <DateInput value={fromDate} onChange={onFromDateChange} min={minDate} max={maxDate} placeholder="From date to today" className="sm:w-44" />
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={!fromDate && days === 14}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3 text-sm font-semibold text-[#020659] transition hover:border-[#040DBF]/25 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ShowAllButton({ total, expanded, onClick }: { total: number; expanded: boolean; onClick: () => void }) {
    if (total <= activityDefaultLimit) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3 py-1.5 text-xs font-semibold text-[#020659] transition hover:border-[#040DBF]/25 hover:bg-white hover:text-[#010440]"
        >
            {expanded ? `Show top ${activityDefaultLimit} only` : `Show all ${total}`}
        </button>
    );
}
