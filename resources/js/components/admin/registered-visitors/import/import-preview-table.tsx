import { paginationItems } from '@/components/ui/pagination-utils';
import type { LibraryMemberImportPreview } from '@/types/registered-visitors';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ImportPreviewRow, SortableImportHead } from './import-preview-table-parts';
import type { ImportPreviewSort } from './import-preview-types';

interface ImportPreviewTableProps {
    members: NonNullable<LibraryMemberImportPreview['members']>;
    membersCount: number;
    displayedCount: number;
    startIndex: number;
    sortColumn: ImportPreviewSort;
    sortDirection: 'asc' | 'desc';
    onSort: (column: ImportPreviewSort) => void;
    currentPage: number;
    totalPages: number;
    from: number;
    to: number;
    total: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rows: number) => void;
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
    members,
    membersCount,
    displayedCount,
    startIndex,
    sortColumn,
    sortDirection,
    onSort,
    currentPage,
    totalPages,
    from,
    to,
    total,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
}: ImportPreviewTableProps) {
    return (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
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
                    <tbody className="divide-y divide-zinc-100">
                        {members.map((member, index) => (
                            <ImportPreviewRow key={`${member.name}-${startIndex + index}`} member={member} />
                        ))}
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

            {/* Pagination controls */}
            {total > 0 && (
                <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">
                        Showing {from}-{to} of {total}
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500">Rows:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    onRowsPerPageChange(Number(e.target.value));
                                    onPageChange(1);
                                }}
                                className="h-7 rounded border border-zinc-300 bg-white px-2 py-0 text-xs font-medium text-zinc-800 outline-none focus:border-[#040DBF]"
                            >
                                <option value={5}>5 rows</option>
                                <option value={10}>10 rows</option>
                                <option value={20}>20 rows</option>
                                <option value={50}>50 rows</option>
                            </select>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => onPageChange(1)}
                                    disabled={currentPage === 1}
                                    className="inline-flex size-6 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
                                    title="First page"
                                >
                                    <ChevronsLeft className="size-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex size-6 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
                                    title="Previous page"
                                >
                                    <ChevronLeft className="size-3" />
                                </button>

                                {paginationItems(currentPage, totalPages).map((item, idx) =>
                                    item === 'ellipsis' ? (
                                        <span key={`prev-el-${idx}`} className="px-1 text-zinc-400">
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => onPageChange(item)}
                                            className={`inline-flex size-6 items-center justify-center rounded text-xs transition ${
                                                item === currentPage
                                                    ? 'bg-[#040DBF] font-semibold text-white shadow-sm'
                                                    : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        >
                                            {item}
                                        </button>
                                    ),
                                )}

                                <button
                                    type="button"
                                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex size-6 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
                                    title="Next page"
                                >
                                    <ChevronRight className="size-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex size-6 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
                                    title="Last page"
                                >
                                    <ChevronsRight className="size-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
