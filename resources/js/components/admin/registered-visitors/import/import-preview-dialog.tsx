import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LibraryMemberImportPreview } from '@/types/registered-visitors';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { compareImportValues, importSearchValue, importSortValue } from './import-preview-helpers';
import { ImportPreviewSearch } from './import-preview-search';
import { ImportPreviewSummary } from './import-preview-summary';
import { ImportPreviewTable } from './import-preview-table';
import { SkippedRows } from './import-preview-table-parts';
import type { ImportPreviewSort } from './import-preview-types';

interface ImportPreviewDialogProps {
    open: boolean;
    preview: LibraryMemberImportPreview | null;
    processing: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export function ImportPreviewDialog({ open, preview, processing, onCancel, onConfirm }: ImportPreviewDialogProps) {
    const members = useMemo(() => preview?.members ?? [], [preview?.members]);
    const [importSearch, setImportSearch] = useState('');
    const [sortColumn, setSortColumn] = useState<ImportPreviewSort>('status');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [activeTab, setActiveTab] = useState<'ready' | 'skipped'>('ready');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);

    const displayedMembers = useMemo(() => {
        const normalizedSearch = importSearch.trim().toLowerCase();
        const filtered = normalizedSearch ? members.filter((member) => importSearchValue(member).includes(normalizedSearch)) : members;

        return [...filtered].sort((first, second) => {
            const comparison = compareImportValues(importSortValue(first, sortColumn), importSortValue(second, sortColumn));

            return sortDirection === 'asc' ? comparison : comparison * -1;
        });
    }, [importSearch, members, sortColumn, sortDirection]);

    const totalRows = displayedMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * rowsPerPage;
    const paginatedMembers = displayedMembers.slice(startIndex, startIndex + rowsPerPage);
    const from = totalRows === 0 ? 0 : startIndex + 1;
    const to = Math.min(startIndex + rowsPerPage, totalRows);

    const canImport = (preview?.importable_count ?? 0) > 0;
    const importActionLabel = preview?.importable_count === 1 ? 'Import 1 row' : `Import ${preview?.importable_count ?? 0} rows`;

    useEffect(() => {
        if (!open) {
            return;
        }

        setCurrentPage(1);
        setImportSearch('');
        setSortColumn('status');
        setSortDirection('asc');
        setActiveTab(preview && preview.importable_count === 0 && preview.skipped_count > 0 ? 'skipped' : 'ready');
    }, [open, preview]);

    useEffect(() => {
        setCurrentPage(1);
    }, [importSearch, rowsPerPage]);

    const changeSort = (column: ImportPreviewSort) => {
        setCurrentPage(1);
        setSortColumn((currentColumn) => {
            if (currentColumn === column) {
                setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));

                return currentColumn;
            }

            setSortDirection('asc');

            return column;
        });
    };

    return (
        <Dialog open={open} onOpenChange={() => undefined}>
            <DialogContent
                hideClose
                className="top-4 max-h-[calc(100dvh-2rem)] ![translate:-50%_0] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-5xl"
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl text-[#010440]">Confirm visitor import</DialogTitle>
                    <DialogDescription>
                        Review the parsed students or employees before saving. Imports require School ID, First Name, and Last Name. Middle Name and
                        RFID are optional.
                    </DialogDescription>
                </DialogHeader>

                {preview && (
                    <div className="min-h-0 space-y-4 overflow-y-auto pr-1 pb-2">
                        <ImportPreviewSummary preview={preview} />

                        {preview.skipped_count > 0 && (
                            <div className="flex gap-4 border-b border-zinc-200">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ready')}
                                    className={`-mb-px flex items-center gap-2 border-b-2 pb-2 text-sm font-medium transition-colors ${
                                        activeTab === 'ready'
                                            ? 'border-[#040DBF] text-[#040DBF]'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-800'
                                    }`}
                                >
                                    <span>Ready to import</span>
                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                                        {preview.importable_count}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('skipped')}
                                    className={`-mb-px flex items-center gap-2 border-b-2 pb-2 text-sm font-medium transition-colors ${
                                        activeTab === 'skipped'
                                            ? 'border-amber-600 font-semibold text-amber-700'
                                            : 'border-transparent text-amber-700/80 hover:text-amber-800'
                                    }`}
                                >
                                    <span>Skipped / Needs attention</span>
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                        {preview.skipped_count}
                                    </span>
                                </button>
                            </div>
                        )}

                        {activeTab === 'ready' ? (
                            <>
                                <ImportPreviewSearch
                                    value={importSearch}
                                    displayedCount={displayedMembers.length}
                                    totalCount={members.length}
                                    onChange={(value) => setImportSearch(value)}
                                />
                                <ImportPreviewTable
                                    members={paginatedMembers}
                                    membersCount={members.length}
                                    displayedCount={displayedMembers.length}
                                    startIndex={startIndex}
                                    sortColumn={sortColumn}
                                    sortDirection={sortDirection}
                                    onSort={changeSort}
                                    currentPage={safePage}
                                    totalPages={totalPages}
                                    from={from}
                                    to={to}
                                    total={totalRows}
                                    rowsPerPage={rowsPerPage}
                                    onPageChange={setCurrentPage}
                                    onRowsPerPageChange={setRowsPerPage}
                                />
                            </>
                        ) : (
                            <SkippedRows rows={preview.skipped} fileName={preview.file_name} />
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
                        <XCircle className="size-4" />
                        {canImport ? 'No, cancel' : 'Okay, close'}
                    </Button>
                    {preview && canImport && (
                        <Button type="button" onClick={onConfirm} disabled={processing}>
                            <CheckCircle2 className="size-4" />
                            {importActionLabel}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
