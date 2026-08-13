import { BarChart3, ClipboardList, ListChecks, type LucideIcon } from 'lucide-react';
import type { VisitorTypeFilter } from './visit-logs-helpers';

export type VisitLogsView = 'records' | 'watchlist' | 'progress';

interface VisitLogsWorkspaceProps {
    activeView: VisitLogsView;
    visitorType: VisitorTypeFilter;
    onViewChange: (view: VisitLogsView) => void;
}

const viewItems: Array<{ value: VisitLogsView; label: string; detail: string; icon: LucideIcon }> = [
    {
        value: 'records',
        label: 'Records',
        detail: 'Searchable visit history and timestamps',
        icon: ClipboardList,
    },
    {
        value: 'watchlist',
        label: 'Watchlist',
        detail: 'Low-visit people and weak groups',
        icon: ListChecks,
    },
    {
        value: 'progress',
        label: 'Progress',
        detail: 'Individual required-visit completion',
        icon: BarChart3,
    },
];

export function VisitLogsWorkspace({ activeView, visitorType, onViewChange }: VisitLogsWorkspaceProps) {
    const audienceLabel = visitorType === 'student' ? 'Student' : 'Employee';

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#030A8C]">{audienceLabel} workspace</p>
                    <p className="mt-1 text-sm text-[#020659]/70">Choose the view you want to inspect for this audience.</p>
                </div>
                <span className="rounded-full bg-[#040DBF]/10 px-3 py-1.5 text-xs font-semibold text-[#030A8C]">
                    {visitorType === 'student' ? 'Students' : 'Employees'}
                </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                {viewItems.map((item) => (
                    <WorkspaceButton
                        key={item.value}
                        active={activeView === item.value}
                        icon={item.icon}
                        label={item.label}
                        detail={item.detail}
                        onClick={() => onViewChange(item.value)}
                    />
                ))}
            </div>
        </section>
    );
}

function WorkspaceButton({
    active,
    icon: Icon,
    label,
    detail,
    onClick,
}: {
    active: boolean;
    icon: LucideIcon;
    label: string;
    detail: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`grid min-h-24 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 rounded-lg border p-3 text-left transition-[background-color,border-color,color,box-shadow,transform] hover:-translate-y-0.5 ${
                active
                    ? 'border-[#040DBF] bg-[#040DBF] text-white shadow-md shadow-[#040DBF]/20'
                    : 'border-[#040DBF]/10 bg-[#f6f8ff] text-[#010440] hover:border-[#040DBF]/25 hover:bg-white hover:shadow-sm'
            }`}
        >
            <span
                className={`inline-flex size-10 items-center justify-center rounded-lg ${
                    active ? 'bg-white/15 text-white' : 'admin-icon-badge bg-[#040DBF]/10 text-[#040DBF]'
                }`}
            >
                <Icon className="size-5" />
            </span>
            <span className="min-w-0">
                <span className="block font-semibold">{label}</span>
                <span className={`mt-1 block text-sm leading-5 ${active ? 'text-white/75' : 'text-[#020659]/70'}`}>{detail}</span>
            </span>
        </button>
    );
}
