import { TableCell, TableRow } from '@/components/ui/table';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import { formatVisitDateTime, groupLabel, type VisitorWithRangeVisits } from './visit-history-helpers';

interface VisitHistoryTableRowProps {
    visitor: VisitorWithRangeVisits;
    requiredVisits: number;
    selected?: boolean;
    onOpen: (visitor: VisitorWithRangeVisits) => void;
}

export function VisitHistoryTableRow({ visitor, requiredVisits, selected, onOpen }: VisitHistoryTableRowProps) {
    const progressText =
        requiredVisits > 0 ? `${Math.min(visitor.rangeVisits.length, requiredVisits)}/${requiredVisits}` : `${visitor.rangeVisits.length}`;
    const complete = requiredVisits > 0 && visitor.rangeVisits.length >= requiredVisits;

    return (
        <TableRow
            tabIndex={0}
            onClick={() => onOpen(visitor)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen(visitor);
                }
            }}
            className={`cursor-pointer transition-colors focus-visible:bg-[#f6f8ff] focus-visible:outline-none ${selected ? 'bg-amber-50 dark:bg-amber-400/15' : ''}`}
        >
            <TableCell className="font-medium text-[#010440]">{visitor.schoolId ?? '-'}</TableCell>
            <TableCell>
                <div className="flex min-w-0 items-center gap-3">
                    <VisitorAvatar
                        name={visitor.name}
                        src={visitor.photoUrl}
                        className="live-visit-avatar bg-[#eef2ff] text-[#030A8C]/70 ring-1 ring-[#040DBF]/10"
                    />
                    <span className="truncate font-medium text-[#010440]">{visitor.name ?? '-'}</span>
                </div>
            </TableCell>
            <TableCell className="text-[#020659]/70">{groupLabel(visitor)}</TableCell>
            <TableCell className="font-semibold text-[#010440]">
                <div className="flex flex-col gap-1">
                    <span>{visitor.rangeVisits.length.toLocaleString()} total</span>
                    <span className={`text-xs font-medium ${complete ? 'text-emerald-700' : 'text-[#020659]/65'}`}>
                        {progressText} {complete ? 'completed' : 'progress'}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-[#020659]/70">{formatVisitDateTime(visitor.rangeVisits[0]?.visitedAt)}</TableCell>
        </TableRow>
    );
}

export function VisitHistoryEmptyRow() {
    return (
        <TableRow>
            <TableCell colSpan={5} className="px-5 py-14 text-center">
                <p className="font-medium text-[#010440]">No visitors match the selected filters</p>
                <p className="mt-2 text-sm text-[#020659]/70">Try a wider date range or clear one of the visitor filters.</p>
            </TableCell>
        </TableRow>
    );
}
