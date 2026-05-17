import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LibraryMemberImportPreview, LibraryMemberImportPreviewMember } from '@/types/registered-visitors';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ChevronsUpDown, Search, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ImportPreviewDialogProps {
    open: boolean;
    preview: LibraryMemberImportPreview | null;
    processing: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

type ImportPreviewSort = 'status' | 'name' | 'type' | 'school_id' | 'rfid_uid' | 'year_level' | 'section';

export function ImportPreviewDialog({ open, preview, processing, onCancel, onConfirm }: ImportPreviewDialogProps) {
    const members = useMemo(() => preview?.members ?? [], [preview?.members]);
    const [importSearch, setImportSearch] = useState('');
    const [sortColumn, setSortColumn] = useState<ImportPreviewSort>('status');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const displayedMembers = useMemo(() => {
        const normalizedSearch = importSearch.trim().toLowerCase();
        const filtered = normalizedSearch ? members.filter((member) => importSearchValue(member).includes(normalizedSearch)) : members;

        return [...filtered].sort((first, second) => {
            const comparison = compareImportValues(importSortValue(first, sortColumn), importSortValue(second, sortColumn));

            return sortDirection === 'asc' ? comparison : comparison * -1;
        });
    }, [importSearch, members, sortColumn, sortDirection]);
    const rowHeight = 58;
    const overscan = 10;
    const tableScrollerRef = useRef<HTMLDivElement | null>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(420);
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
        setScrollTop(0);
        tableScrollerRef.current?.scrollTo({ top: 0 });
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
                    <DialogDescription>Review the parsed members before saving them. Choose No if this is not the correct file.</DialogDescription>
                </DialogHeader>

                {preview && (
                    <div className="min-h-0 space-y-4 overflow-y-auto pr-1 pb-2">
                        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
                            <p className="text-sm font-semibold text-[#010440]">{preview.file_name}</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-4">
                                <ImportStat label="Rows read" value={preview.total_rows} />
                                <ImportStat label="Ready" value={preview.importable_count} />
                                <ImportStat label="New" value={preview.create_count} />
                                <ImportStat label="RFID fills" value={preview.update_count} />
                            </div>
                            <div className="mt-3 space-y-1 text-sm">
                                {preview.importable_count === 0 && preview.skipped_count > 0 && (
                                    <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 font-medium text-red-700">
                                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                        <p>
                                            This file cannot be imported because none of its rows are safe to save. Review the skipped row preview
                                            below for the exact issue.
                                        </p>
                                    </div>
                                )}
                                {preview.skipped_count > 0 && preview.importable_count > 0 && (
                                    <p className="font-medium text-amber-700">
                                        {preview.skipped_count} row{preview.skipped_count === 1 ? '' : 's'} will be skipped because required import
                                        data is missing, invalid, or already registered.
                                    </p>
                                )}
                            </div>
                        </div>

                        <ImportPreviewSearch
                            value={importSearch}
                            displayedCount={displayedMembers.length}
                            totalCount={members.length}
                            onChange={(value) => {
                                setImportSearch(value);
                                setScrollTop(0);
                                tableScrollerRef.current?.scrollTo({ top: 0 });
                            }}
                        />

                        <div
                            ref={tableScrollerRef}
                            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
                            className="max-h-[min(24rem,45dvh)] overflow-auto rounded-lg border border-zinc-200"
                        >
                            <table className="w-full min-w-[980px] text-left text-sm">
                                <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                                    <tr>
                                        <SortableImportHead
                                            column="status"
                                            label="Status"
                                            sort={sortColumn}
                                            direction={sortDirection}
                                            onSort={changeSort}
                                        />
                                        <SortableImportHead
                                            column="name"
                                            label="Name"
                                            sort={sortColumn}
                                            direction={sortDirection}
                                            onSort={changeSort}
                                        />
                                        <SortableImportHead
                                            column="type"
                                            label="Type"
                                            sort={sortColumn}
                                            direction={sortDirection}
                                            onSort={changeSort}
                                        />
                                        <SortableImportHead
                                            column="school_id"
                                            label="School ID"
                                            sort={sortColumn}
                                            direction={sortDirection}
                                            onSort={changeSort}
                                        />
                                        <SortableImportHead
                                            column="rfid_uid"
                                            label="RFID"
                                            sort={sortColumn}
                                            direction={sortDirection}
                                            onSort={changeSort}
                                        />
                                        <SortableImportHead
                                            column="year_level"
                                            label="Year level / Dept."
                                            sort={sortColumn}
                                            direction={sortDirection}
                                            onSort={changeSort}
                                        />
                                        <SortableImportHead
                                            column="section"
                                            label="Section"
                                            sort={sortColumn}
                                            direction={sortDirection}
                                            onSort={changeSort}
                                        />
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
                                    {members.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                                                No importable members found in this file.
                                            </td>
                                        </tr>
                                    )}
                                    {members.length > 0 && displayedMembers.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                                                No members match your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

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

function ImportPreviewSearch({
    value,
    displayedCount,
    totalCount,
    onChange,
}: {
    value: string;
    displayedCount: number;
    totalCount: number;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="relative min-w-0">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Search name, school ID, or RFID"
                    className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-9 pl-9 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                        title="Clear search"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>
            <p className="text-xs text-zinc-500">
                Showing {displayedCount} of {totalCount}
            </p>
        </div>
    );
}

function ImportStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg bg-white px-3 py-2">
            <p className="text-xs font-medium text-[#020659]/65">{label}</p>
            <p className="mt-1 text-xl font-semibold text-[#010440]">{value}</p>
        </div>
    );
}

function SortableImportHead({
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

function ImportPreviewRow({ member }: { member: LibraryMemberImportPreviewMember }) {
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

function SkippedRows({ rows }: { rows: LibraryMemberImportPreview['skipped'] }) {
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

function importSearchValue(member: LibraryMemberImportPreviewMember): string {
    return [
        member.name,
        member.matched_name,
        member.school_id,
        member.rfid_uid,
        member.type,
        member.year_level,
        member.section,
        member.department,
        member.status,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function importSortValue(member: LibraryMemberImportPreviewMember, column: ImportPreviewSort): string {
    if (column === 'year_level') {
        return member.type === 'student' ? (member.year_level ?? '') : (member.department ?? '');
    }

    return String(member[column] ?? '');
}

function compareImportValues(first: string, second: string): number {
    return first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });
}
