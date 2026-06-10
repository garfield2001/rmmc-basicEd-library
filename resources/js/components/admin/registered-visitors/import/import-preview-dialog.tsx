import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LibraryMemberImportPreview } from '@/types/registered-visitors';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const rowHeight = 58, overscan = 10;

export function ImportPreviewDialog({ open, preview, processing, onCancel, onConfirm }: ImportPreviewDialogProps) {
    const members = useMemo(() => preview?.members ?? [], [preview?.members]);
    const [importSearch, setImportSearch] = useState('');
    const [sortColumn, setSortColumn] = useState<ImportPreviewSort>('status');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const tableScrollerRef = useRef<HTMLDivElement | null>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(420);
    const displayedMembers = useMemo(() => {
        const normalizedSearch = importSearch.trim().toLowerCase();
        const filtered = normalizedSearch ? members.filter((member) => importSearchValue(member).includes(normalizedSearch)) : members;

        return [...filtered].sort((first, second) => {
            const comparison = compareImportValues(importSortValue(first, sortColumn), importSortValue(second, sortColumn));

            return sortDirection === 'asc' ? comparison : comparison * -1;
        });
    }, [importSearch, members, sortColumn, sortDirection]);
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(displayedMembers.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan);
    const visibleMembers = displayedMembers.slice(startIndex, Math.max(startIndex + 1, endIndex));
    const topPadding = startIndex * rowHeight;
    const bottomPadding = Math.max(0, (displayedMembers.length - endIndex) * rowHeight);
    const canImport = (preview?.importable_count ?? 0) > 0;
    const importActionLabel = preview?.importable_count === 1 ? 'Import 1 row' : `Import ${preview?.importable_count ?? 0} rows`;

    useEffect(() => {
        if (!open) {
            return;
        }

        setScrollTop(0);
        setImportSearch('');
        setSortColumn('status');
        setSortDirection('asc');
        tableScrollerRef.current?.scrollTo({ top: 0 });
    }, [open, preview]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const updateViewportHeight = () => setViewportHeight(tableScrollerRef.current?.clientHeight ?? 420);

        updateViewportHeight();
        window.addEventListener('resize', updateViewportHeight);

        return () => window.removeEventListener('resize', updateViewportHeight);
    }, [open]);

    const changeSort = (column: ImportPreviewSort) => {
        resetTableScroll();
        setSortColumn((currentColumn) => {
            if (currentColumn === column) {
                setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));

                return currentColumn;
            }

            setSortDirection('asc');

            return column;
        });
    };

    const resetTableScroll = () => {
        setScrollTop(0);
        tableScrollerRef.current?.scrollTo({ top: 0 });
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
                        <ImportPreviewSearch
                            value={importSearch}
                            displayedCount={displayedMembers.length}
                            totalCount={members.length}
                            onChange={(value) => {
                                setImportSearch(value);
                                resetTableScroll();
                            }}
                        />
                        <ImportPreviewTable
                            tableScrollerRef={tableScrollerRef}
                            visibleMembers={visibleMembers}
                            membersCount={members.length}
                            displayedCount={displayedMembers.length}
                            topPadding={topPadding}
                            bottomPadding={bottomPadding}
                            startIndex={startIndex}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onScroll={setScrollTop}
                            onSort={changeSort}
                        />
                        {canImport && <p className="text-xs text-zinc-500">Scroll to review all importable members.</p>}
                        {preview.skipped.length > 0 && <SkippedRows rows={preview.skipped} />}
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
