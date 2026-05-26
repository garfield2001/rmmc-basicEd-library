import { activityDefaultLimit } from './activity-breakdown-helpers';

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
            {expanded ? `Show top ${activityDefaultLimit}` : 'Show all'}
        </button>
    );
}
