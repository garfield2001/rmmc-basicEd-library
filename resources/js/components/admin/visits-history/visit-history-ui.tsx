import { TableHead } from '@/components/ui/table';
import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { SortColumn, SortDirection, VisitorTypeFilter } from './visit-history-helpers';

export function VisitTypeTab({
    value,
    activeValue,
    label,
    count,
    icon: Icon,
    onChange,
}: {
    value: VisitorTypeFilter;
    activeValue: VisitorTypeFilter;
    label: string;
    count: number;
    icon: LucideIcon;
    onChange: (value: VisitorTypeFilter) => void;
}) {
    const isActive = value === activeValue;

    return (
        <button type="button" onClick={() => onChange(value)} className={`admin-segmented-tab ${isActive ? 'admin-segmented-tab-active' : ''}`}>
            <Icon className="size-3.5" />
            {label}
            <span className={isActive ? 'text-white/75' : 'text-[#030A8C]/60'}>{count}</span>
        </button>
    );
}

export function HistoryMetricCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: number; detail: string }) {
    return (
        <div className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-[#030A8C]">{label}</p>
                    <p className="mt-3 text-4xl font-semibold tracking-normal text-[#010440]">{value.toLocaleString()}</p>
                </div>
                <span className="admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                    <Icon className="size-5" />
                </span>
            </div>
            <p className="mt-3 text-sm text-[#020659]/70">{detail}</p>
        </div>
    );
}

export function SortableHead({
    column,
    label,
    sort,
    direction,
    onSortChange,
}: {
    column: SortColumn;
    label: string;
    sort: SortColumn;
    direction: SortDirection;
    onSortChange: (column: SortColumn) => void;
}) {
    const active = sort === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <TableHead>
            <button type="button" onClick={() => onSortChange(column)} className="inline-flex items-center gap-1.5 hover:text-[#010440]">
                {label}
                <Icon className="size-3.5" />
            </button>
        </TableHead>
    );
}
