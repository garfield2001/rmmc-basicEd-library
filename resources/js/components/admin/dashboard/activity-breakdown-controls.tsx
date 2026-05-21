import { ChevronLeft, ChevronRight } from 'lucide-react';
import { activityDefaultLimit, activityPanelDetails, activityPanelOrder, type ActivityPanel } from './activity-breakdown-helpers';

interface ActivityBreakdownControlsProps {
    active: ActivityPanel;
    onPanelChange: (panel: ActivityPanel) => void;
}

export function ActivityBreakdownControls({ active, onPanelChange }: ActivityBreakdownControlsProps) {
    const activeIndex = activityPanelOrder.indexOf(active);
    const previous = activityPanelOrder[(activeIndex - 1 + activityPanelOrder.length) % activityPanelOrder.length];
    const next = activityPanelOrder[(activeIndex + 1) % activityPanelOrder.length];
    const activeDetails = activityPanelDetails[active];
    const ActiveIcon = activeDetails.icon;

    return (
        <div className="group relative flex h-10 w-full max-w-[24rem] items-center justify-center overflow-hidden rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff]">
            <CarouselArrow label="Previous activity panel" direction="left" onClick={() => onPanelChange(previous)} />
            <button
                type="button"
                onClick={() => onPanelChange(next)}
                className="flex h-full w-full items-center justify-center gap-2 px-10 text-sm font-semibold text-[#010440] transition-transform duration-200 active:scale-[0.98]"
            >
                <ActiveIcon className="size-4 text-[#040DBF]" />
                <span>{activeDetails.label}</span>
            </button>
            <CarouselArrow label="Next activity panel" direction="right" onClick={() => onPanelChange(next)} />
        </div>
    );
}

function CarouselArrow({ label, direction, onClick }: { label: string; direction: 'left' | 'right'; onClick: () => void }) {
    const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#020659] opacity-0 shadow-sm ring-1 ring-[#040DBF]/10 transition duration-200 group-hover:opacity-100 hover:bg-[#040DBF] hover:text-white ${
                direction === 'left' ? 'left-1 -translate-x-2 group-hover:translate-x-0' : 'right-1 translate-x-2 group-hover:translate-x-0'
            }`}
        >
            <Icon className="size-4" />
        </button>
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
