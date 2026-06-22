import { TableCell, TableRow } from '@/components/ui/table';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import { cn } from '@/lib/utils';
import type { LibraryMemberRow } from '@/types/registered-visitors';
import { AlertTriangle, Pencil } from 'lucide-react';
import type { ColumnKey, ColumnOption, VisitorType } from './visitors-table-types';

export function VisitorDataRow({ visitor, activeType, onEdit }: { visitor: LibraryMemberRow; activeType: VisitorType; onEdit: () => void }) {
    return (
        <TableRow>
            <TableCell>
                <VisitorIdentity visitor={visitor} />
            </TableCell>
            <TableCell className="font-medium">{visitor.school_id || '-'}</TableCell>
            {activeType === 'student' ? (
                <>
                    <TableCell className="text-zinc-500">{visitor.student?.year_level || '-'}</TableCell>
                    <TableCell className="text-zinc-500">{visitor.student?.section || '-'}</TableCell>
                </>
            ) : (
                <TableCell className="text-zinc-500">{visitor.employee?.department || '-'}</TableCell>
            )}
            <TableCell>
                <div className="flex justify-end">
                    <ActionButton
                        label={activeType === 'student' ? 'Edit student details' : 'Edit employee details'}
                        icon={Pencil}
                        onClick={onEdit}
                    />
                </div>
            </TableCell>
        </TableRow>
    );
}

export function LoadingRows({ columns, activeType, rowCount }: { columns: ColumnOption[]; activeType: VisitorType; rowCount: number }) {
    return (
        <>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                    {columns.map((column) => (
                        <TableCell key={column.key}>
                            <LoadingCell column={column.key} activeType={activeType} />
                        </TableCell>
                    ))}
                    <TableCell>
                        <div className="flex justify-end">
                            <SkeletonBlock className="size-9 rounded-lg" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

function LoadingCell({ column, activeType }: { column: ColumnKey; activeType: VisitorType }) {
    if (column === 'visitor') {
        return (
            <div className="flex items-center gap-3">
                <SkeletonBlock className="size-10 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-3.5 w-36 max-w-full rounded-full" />
                    <SkeletonBlock className="h-3 w-24 max-w-full rounded-full" />
                </div>
            </div>
        );
    }

    if (column === 'year_level' || column === 'department') {
        return <SkeletonBlock className={`h-3.5 rounded-full ${activeType === 'employee' ? 'w-44' : 'w-24'}`} />;
    }

    return <SkeletonBlock className="h-3.5 w-28 rounded-full" />;
}

function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse bg-zinc-200/80 ${className}`} />;
}

function VisitorIdentity({ visitor }: { visitor: LibraryMemberRow }) {
    return (
        <div className="flex items-center gap-3">
            <VisitorAvatar name={visitor.name} src={visitor.photo_url} />
            <div className="min-w-0">
                <p className="min-w-0 font-medium">{visitor.name}</p>
                {visitor.duplicate_count > 0 && (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="size-3" />
                        {visitor.duplicate_count} duplicate{visitor.duplicate_count === 1 ? '' : 's'} to merge
                    </p>
                )}
            </div>
        </div>
    );
}

function ActionButton({ label, icon: Icon, onClick }: { label: string; icon: typeof Pencil; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn('inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100')}
            title={label}
        >
            <Icon className="size-4" />
        </button>
    );
}
