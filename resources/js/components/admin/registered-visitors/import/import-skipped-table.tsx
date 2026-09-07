import { Button } from '@/components/ui/button';
import { paginationItems } from '@/components/ui/pagination-utils';
import type { LibraryMemberImportSkippedRow } from '@/types/registered-visitors';
import { AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { exportSkippedRowsToCsv } from './import-export-csv';

interface ImportSkippedTableProps {
    rows: LibraryMemberImportSkippedRow[];
    fileName?: string;
    title?: string;
    description?: string;
}

export function ImportSkippedTable({
    rows,
    fileName = 'visitors',
    title = 'Records Needing Attention (Unimported)',
    description = 'These rows were skipped because they contain invalid, incomplete, or conflicting data such as incorrect School ID lengths.',
}: ImportSkippedTableProps) {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return rows;
        }

        return rows.filter((row) => {
            const haystack = [
                row.name,
                row.type,
                row.school_id,
                row.rfid_uid,
                row.year_level,
                row.section,
                row.department,
                row.reason,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [rows, search]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, rowsPerPage, rows]);

    const totalRows = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * rowsPerPage;
    const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);
    const from = totalRows === 0 ? 0 : startIndex + 1;
    const to = Math.min(startIndex + rowsPerPage, totalRows);

    const handleExport = () => {
        exportSkippedRowsToCsv(rows, fileName);
    };

    if (rows.length === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border border-amber-300/80 bg-amber-50/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="size-4 text-amber-600 shrink-0" />
                        <h4 className="text-sm font-semibold text-amber-950">
                            {title} ({rows.length})
                        </h4>
                    </div>
                    {description && <p className="mt-1 text-xs text-amber-900/80">{description}</p>}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-100/60"
                >
                    <Download className="mr-1.5 size-3.5" />
                    Export unimported (.csv)
                </Button>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search unimported records by name, ID, or issue..."
                        className="h-8 w-full rounded-md border border-zinc-300 bg-white pr-8 pl-8 text-xs placeholder:text-zinc-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>
                {search && (
                    <span className="text-xs text-zinc-500">
                        {filteredRows.length} of {rows.length}
                    </span>
                )}
            </div>

            <div className="mt-3 overflow-hidden rounded-md border border-amber-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-amber-200 bg-amber-100/60 text-amber-950 font-medium">
                            <tr>
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Type</th>
                                <th className="px-3 py-2">Provided School ID</th>
                                <th className="px-3 py-2">Placement / Dept</th>
                                <th className="px-3 py-2">Reason / Diagnostic</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {paginatedRows.map((row, index) => {
                                const placement =
                                    row.type === 'student'
                                        ? [row.year_level, row.section].filter(Boolean).join(' - ') || 'No section'
                                        : row.department || 'No dept';

                                const isSchoolIdIssue =
                                    row.reason.toLowerCase().includes('school id') ||
                                    row.reason.toLowerCase().includes('digits') ||
                                    row.reason.toLowerCase().includes('lrn');

                                return (
                                    <tr key={`${row.name}-${row.school_id}-${startIndex + index}`} className="hover:bg-amber-50/30">
                                        <td className="px-3 py-2 font-medium text-zinc-900">{row.name}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                                                    row.type === 'employee'
                                                        ? 'bg-purple-50 text-purple-700'
                                                        : 'bg-blue-50 text-blue-700'
                                                }`}
                                            >
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            {row.school_id ? (
                                                <span
                                                    className={`inline-block font-mono text-[11px] px-1.5 py-0.5 rounded ${
                                                        row.school_id.length !== 10
                                                            ? 'bg-red-50 text-red-700 font-semibold border border-red-200'
                                                            : 'bg-zinc-100 text-zinc-800'
                                                    }`}
                                                >
                                                    {row.school_id}
                                                </span>
                                            ) : (
                                                <span className="italic text-zinc-400">Missing</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-zinc-600">{placement}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={
                                                    isSchoolIdIssue
                                                        ? 'font-medium text-red-700'
                                                        : 'text-amber-800'
                                                }
                                            >
                                                {row.reason}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedRows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-xs text-zinc-500">
                                        No unimported records match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col gap-2 border-t border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium text-zinc-600">
                        Showing {from}-{to} of {totalRows}
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500">Rows:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="h-7 rounded border border-amber-300 bg-white px-2 py-0 text-xs font-medium text-zinc-800 outline-none focus:border-amber-500"
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
                                    onClick={() => setCurrentPage(1)}
                                    disabled={safePage === 1}
                                    className="inline-flex size-6 items-center justify-center rounded border border-amber-300 bg-white text-amber-950 transition hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-40"
                                    title="First page"
                                >
                                    <ChevronsLeft className="size-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={safePage === 1}
                                    className="inline-flex size-6 items-center justify-center rounded border border-amber-300 bg-white text-amber-950 transition hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-40"
                                    title="Previous page"
                                >
                                    <ChevronLeft className="size-3" />
                                </button>

                                {paginationItems(safePage, totalPages).map((item, idx) =>
                                    item === 'ellipsis' ? (
                                        <span key={`el-${idx}`} className="px-1 text-zinc-400">
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setCurrentPage(item)}
                                            className={`inline-flex size-6 items-center justify-center rounded text-xs transition ${
                                                item === safePage
                                                    ? 'bg-amber-600 font-semibold text-white shadow-sm'
                                                    : 'border border-amber-300 bg-white text-amber-950 hover:bg-amber-100'
                                            }`}
                                        >
                                            {item}
                                        </button>
                                    ),
                                )}

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={safePage === totalPages}
                                    className="inline-flex size-6 items-center justify-center rounded border border-amber-300 bg-white text-amber-950 transition hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-40"
                                    title="Next page"
                                >
                                    <ChevronRight className="size-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={safePage === totalPages}
                                    className="inline-flex size-6 items-center justify-center rounded border border-amber-300 bg-white text-amber-950 transition hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-40"
                                    title="Last page"
                                >
                                    <ChevronsRight className="size-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
