import type { LibraryMemberImportPreview, LibraryMemberImportPreviewMember } from '@/types/registered-visitors';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ImportPreviewSort } from './import-preview-types';

export function SortableImportHead({
    column,
    label,
    sort,
    direction,
    onSort,
}: {
    column: ImportPreviewSort;
    label: string;
    sort: ImportPreviewSort;
    direction: 'asc' | 'desc';
    onSort: (column: ImportPreviewSort) => void;
}) {
    const active = sort === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <th className="px-3 py-2">
            <button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1.5 hover:text-zinc-700">
                {label}
                <Icon className="size-3.5" />
            </button>
        </th>
    );
}

export function ImportPreviewRow({ member }: { member: LibraryMemberImportPreviewMember }) {
    const group = member.type === 'student' ? member.year_level || '-' : member.department || 'No department';
    const section = member.type === 'student' ? member.section || '-' : '-';
    const statusClasses = {
        create: 'bg-emerald-50 text-emerald-700',
        rfid: 'bg-blue-50 text-blue-700',
    } satisfies Record<LibraryMemberImportPreviewMember['status'], string>;
    const statusLabels = {
        create: 'New',
        rfid: 'Fill RFID',
    } satisfies Record<LibraryMemberImportPreviewMember['status'], string>;

    return (
        <tr className="border-t border-zinc-100">
            <td className="px-3 py-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[member.status]}`}>
                    {statusLabels[member.status]}
                </span>
            </td>
            <td className="px-3 py-2 font-medium text-zinc-900">
                <div>{member.name}</div>
                {member.status === 'rfid' && member.matched_name && (
                    <div className="mt-1 text-xs font-normal text-blue-700">RFID will be added to: {member.matched_name}</div>
                )}
            </td>
            <td className="px-3 py-2 text-zinc-600 capitalize">{member.type}</td>
            <td className="px-3 py-2 text-zinc-600">{member.school_id || 'No school ID'}</td>
            <td className="px-3 py-2 text-zinc-600">{member.rfid_uid || 'No RFID'}</td>
            <td className="px-3 py-2 text-zinc-600">{group}</td>
            <td className="px-3 py-2 text-zinc-600">{section}</td>
        </tr>
    );
}

export function SkippedRows({ rows }: { rows: LibraryMemberImportPreview['skipped'] }) {
    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-800">Skipped row preview</p>
            <div className="mt-2 space-y-1">
                {rows.map((row, index) => (
                    <p key={`${row.name}-${index}`} className="text-xs text-amber-800">
                        {row.name}: {row.reason}
                    </p>
                ))}
            </div>
        </div>
    );
}
