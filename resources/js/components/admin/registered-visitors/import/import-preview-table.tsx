import type React from 'react';
import type { LibraryMemberImportPreview } from '@/types/registered-visitors';
import { ImportPreviewRow, SortableImportHead } from './import-preview-table-parts';
import type { ImportPreviewSort } from './import-preview-types';

interface ImportPreviewTableProps {
    tableScrollerRef: React.RefObject<HTMLDivElement | null>;
    visibleMembers: NonNullable<LibraryMemberImportPreview['members']>;
    membersCount: number;
    displayedCount: number;
    topPadding: number;
    bottomPadding: number;
    startIndex: number;
    sortColumn: ImportPreviewSort;
    sortDirection: 'asc' | 'desc';
    onScroll: (scrollTop: number) => void;
    onSort: (column: ImportPreviewSort) => void;
}

const importPreviewColumns: Array<{ key: ImportPreviewSort; label: string }> = [
    { key: 'status', label: 'Status' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'school_id', label: 'School ID' },
    { key: 'rfid_uid', label: 'RFID' },
    { key: 'year_level', label: 'Year level / Dept.' },
    { key: 'section', label: 'Section' },
];

export function ImportPreviewTable({
    tableScrollerRef,
    visibleMembers,
    membersCount,
    displayedCount,
    topPadding,
    bottomPadding,
    startIndex,
    sortColumn,
    sortDirection,
    onScroll,
    onSort,
}: ImportPreviewTableProps) {
    return (
        <div
            ref={tableScrollerRef}
            onScroll={(event) => onScroll(event.currentTarget.scrollTop)}
            className="max-h-[min(24rem,45dvh)] overflow-auto rounded-lg border border-zinc-200"
        >
            <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                    <tr>
                        {importPreviewColumns.map((column) => (
                            <SortableImportHead
                                key={column.key}
                                column={column.key}
                                label={column.label}
                                sort={sortColumn}
                                direction={sortDirection}
                                onSort={onSort}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {topPadding > 0 && (
                        <tr>
                            <td colSpan={7} style={{ height: topPadding }} />
                        </tr>
                    )}
                    {visibleMembers.map((member, index) => (
                        <ImportPreviewRow key={`${member.name}-${startIndex + index}`} member={member} />
                    ))}
                    {bottomPadding > 0 && (
                        <tr>
                            <td colSpan={7} style={{ height: bottomPadding }} />
                        </tr>
                    )}
                    {membersCount === 0 && (
                        <tr>
                            <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                                No importable members found in this file.
                            </td>
                        </tr>
                    )}
                    {membersCount > 0 && displayedCount === 0 && (
                        <tr>
                            <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                                No members match your search.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
