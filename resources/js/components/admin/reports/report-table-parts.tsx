import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { VisitReportRow } from '@/types/reports';
import { ArrowDown, ArrowUp, BriefcaseBusiness, ChevronsUpDown, GraduationCap } from 'lucide-react';
import type { ReportSortColumn, SortDirection, VisitorType } from './report-helpers';

export function ReportRow({ row, visitorType, requiredVisits }: { row: VisitReportRow; visitorType: VisitorType; requiredVisits: number }) {
    const groupLabel =
        visitorType === 'student'
            ? row.year_section_label || [row.year_level, row.section].filter(Boolean).join(' - ') || '-'
            : row.department || '-';
    const GroupIcon = visitorType === 'student' ? GraduationCap : BriefcaseBusiness;

    return (
        <TableRow>
            <TableCell className="font-medium text-[#010440]">{row.school_id}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>
                <span className="inline-flex items-center gap-2">
                    <GroupIcon className="report-table-icon size-4 text-[#040DBF]" />
                    {groupLabel}
                </span>
            </TableCell>
            <TableCell className="font-semibold text-[#010440]">
                {row.visit_count}
                <span className="font-normal text-[#020659]/60"> / {requiredVisits}</span>
                {row.excess_visits > 0 && (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">+{row.excess_visits}</span>
                )}
            </TableCell>
            <TableCell className="min-w-48">
                <div className="flex items-center gap-3">
                    <ProgressBar value={row.progress_percent} className="min-w-28 flex-1" />
                    <span className="w-10 text-right text-sm font-medium text-[#020659]">{row.progress_percent}%</span>
                </div>
            </TableCell>
        </TableRow>
    );
}

export function ReportSortableHead({
    column,
    label,
    sort,
    direction,
    onSortChange,
}: {
    column: ReportSortColumn;
    label: string;
    sort: ReportSortColumn | null;
    direction: SortDirection;
    onSortChange: (column: ReportSortColumn) => void;
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

export function ProgressBar({ value, className }: { value: number; className?: string }) {
    return (
        <div className={cn('admin-progress-track h-2 overflow-hidden rounded-full bg-[#040DBF]/10', className)}>
            <div className="admin-progress-fill h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
        </div>
    );
}
