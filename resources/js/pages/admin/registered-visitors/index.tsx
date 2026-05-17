import { VisitorFormModal } from '@/components/admin/registered-visitors/visitor-form-modal';
import { VisitorsTable } from '@/components/admin/registered-visitors/visitors-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { csrfFetch } from '@/lib/http';
import { type Paginated } from '@/types/pagination';
import {
    type RegisteredVisitorImportPreview,
    type RegisteredVisitorImportPreviewMember,
    type RegisteredVisitorRow,
} from '@/types/registered-visitors';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ChevronsUpDown, Plus, Search, Upload, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface VisitorsIndexProps {
    visitors: Paginated<RegisteredVisitorRow>;
    filters: {
        search: string;
        type: 'student' | 'employee';
        year_level: string;
        section: string;
        department: string;
        sort: string;
        direction: 'asc' | 'desc';
        per_page: RowsPerPageOption;
    };
    filterOptions: {
        yearLevels: string[];
        sectionsByYearLevel: Record<string, string[]>;
        departments: string[];
    };
}

type VisitorType = 'student' | 'employee';

export default function VisitorsIndex({ visitors, filters, filterOptions }: VisitorsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [yearLevel, setYearLevel] = useState(filters.year_level ?? '');
    const [section, setSection] = useState(filters.section ?? '');
    const [department, setDepartment] = useState(filters.department ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'created_at');
    const [direction, setDirection] = useState<'asc' | 'desc'>(filters.direction === 'asc' ? 'asc' : 'desc');
    const [perPage, setPerPage] = useState<RowsPerPageOption>(filters.per_page ?? 5);
    const [tableLoading, setTableLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<RegisteredVisitorImportPreview | null>(null);
    const [importPreviewOpen, setImportPreviewOpen] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [visitorFormOpen, setVisitorFormOpen] = useState(false);
    const [selectedVisitor, setselectedVisitor] = useState<RegisteredVisitorRow | null>(null);
    const importInputRef = useRef<HTMLInputElement | null>(null);
    const loadingTimerRef = useRef<number | null>(null);
    const activeType: VisitorType = filters.type === 'employee' ? 'employee' : 'student';
    const availableSections = useMemo(() => {
        return yearLevel ? (filterOptions.sectionsByYearLevel[yearLevel] ?? []) : [];
    }, [filterOptions.sectionsByYearLevel, yearLevel]);

    const startTableLoading = useCallback(() => {
        if (loadingTimerRef.current) {
            window.clearTimeout(loadingTimerRef.current);
        }

        loadingTimerRef.current = window.setTimeout(() => setTableLoading(true), 250);
    }, []);

    const stopTableLoading = useCallback(() => {
        if (loadingTimerRef.current) {
            window.clearTimeout(loadingTimerRef.current);
            loadingTimerRef.current = null;
        }

        setTableLoading(false);
    }, []);

    const requestVisitors = useCallback(
        (
            type: VisitorType,
            nextSearch: string,
            nextYearLevel: string,
            nextSection: string,
            nextDepartment: string,
            nextPerPage: RowsPerPageOption,
            nextSort = sort,
            nextDirection = direction,
            showLoading = true,
            nextPage = 1,
        ) => {
            if (showLoading) {
                startTableLoading();
            }
            router.get(
                '/admin/registered-visitors',
                {
                    search: nextSearch || undefined,
                    type,
                    year_level: type === 'student' ? nextYearLevel || undefined : undefined,
                    section: type === 'student' && nextYearLevel ? nextSection || undefined : undefined,
                    department: type === 'employee' ? nextDepartment || undefined : undefined,
                    sort: nextSort === 'created_at' ? undefined : nextSort,
                    direction: nextSort === 'created_at' && nextDirection === 'desc' ? undefined : nextDirection,
                    per_page: nextPerPage,
                    page: nextPage > 1 ? nextPage : undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => showLoading && stopTableLoading(),
                },
            );
        },
        [direction, sort, startTableLoading, stopTableLoading],
    );

    useEffect(() => {
        return () => {
            if (loadingTimerRef.current) {
                window.clearTimeout(loadingTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (activeType === 'student' && yearLevel && availableSections.length === 1 && section !== availableSections[0]) {
            setSection(availableSections[0]);
        }
    }, [activeType, availableSections, section, yearLevel]);

    useEffect(() => {
        if (activeType === 'employee' && filterOptions.departments.length === 1 && department !== filterOptions.departments[0]) {
            setDepartment(filterOptions.departments[0]);
        }
    }, [activeType, department, filterOptions.departments]);

    useEffect(() => {
        const normalizedSection = yearLevel ? section : '';
        const matchesFilters =
            filters.search === search &&
            filters.year_level === yearLevel &&
            filters.section === normalizedSection &&
            filters.department === department &&
            filters.type === activeType &&
            filters.sort === sort &&
            filters.direction === direction &&
            filters.per_page === perPage;

        if (matchesFilters) {
            return;
        }

        const filterTimer = window.setTimeout(() => {
            requestVisitors(activeType, search, yearLevel, normalizedSection, department, perPage);
        }, 300);

        return () => window.clearTimeout(filterTimer);
    }, [
        activeType,
        filters.per_page,
        filters.search,
        filters.section,
        filters.sort,
        filters.type,
        filters.year_level,
        filters.direction,
        filters.department,
        perPage,
        requestVisitors,
        search,
        section,
        department,
        sort,
        direction,
        yearLevel,
    ]);

    const changeYearLevel = (value: string) => {
        setYearLevel(value);
        setSection('');
        setSearch('');
    };

    const changeSection = (value: string) => {
        setSection(value);
        setSearch('');
    };

    const changeDepartment = (value: string) => {
        setDepartment(value);
        setSearch('');
    };

    const openCreateVisitor = () => {
        setselectedVisitor(null);
        setVisitorFormOpen(true);
    };

    const openEditVisitor = (visitor: RegisteredVisitorRow) => {
        setselectedVisitor(visitor);
        setVisitorFormOpen(true);
    };

    const previewImport = async (file: File | null) => {
        if (!file) {
            return;
        }

        setImportFile(file);
        setImportPreview(null);
        setImportError(null);
        setImporting(true);

        const formData = new FormData();
        formData.append('visitors_file', file);

        try {
            const response = await csrfFetch('/admin/registered-visitors/import/preview', {
                method: 'POST',
                body: formData,
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const message =
                    payload?.errors?.visitors_file?.[0] ?? payload?.message ?? 'Unable to preview this file. Please check the file and try again.';
                setImportError(message);
                setImportFile(null);
                return;
            }

            setImportPreview(payload.preview);
            setImportPreviewOpen(true);
        } catch {
            setImportError('Unable to preview this file. Please check the file and try again.');
            setImportFile(null);
        } finally {
            setImporting(false);

            if (importInputRef.current) {
                importInputRef.current.value = '';
            }
        }
    };

    const cancelImport = () => {
        if (importing) {
            return;
        }

        setImportPreviewOpen(false);
        setImportPreview(null);
        setImportFile(null);
    };

    const confirmImport = () => {
        if (!importFile || !importPreview) {
            return;
        }

        router.post(
            '/admin/registered-visitors/import',
            { visitors_file: importFile },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => {
                    setImporting(true);
                    setImportError(null);
                },
                onSuccess: () => {
                    setImportPreviewOpen(false);
                    setImportPreview(null);
                    setImportFile(null);
                },
                onError: (errors) => {
                    setImportError(typeof errors.visitors_file === 'string' ? errors.visitors_file : 'Unable to import this file.');
                },
                onFinish: () => {
                    setImporting(false);
                },
            },
        );
    };

    const changeSort = (column: string) => {
        const nextDirection = sort === column && direction === 'asc' ? 'desc' : 'asc';

        setSort(column);
        setDirection(nextDirection);
        requestVisitors(activeType, search, yearLevel, section, department, perPage, column, nextDirection);
    };

    const clearSort = () => {
        setSort('created_at');
        setDirection('desc');
        requestVisitors(activeType, search, yearLevel, section, department, perPage, 'created_at', 'desc');
    };

    const sortForType = (type: VisitorType) => {
        if (type === 'student' && sort === 'department') {
            return 'created_at';
        }

        if (type === 'employee' && ['year_level', 'section'].includes(sort)) {
            return 'created_at';
        }

        return sort;
    };

    const changeType = (type: VisitorType) => {
        const nextSort = sortForType(type);
        const nextDirection = nextSort === 'created_at' ? 'desc' : direction;

        setSort(nextSort);
        setDirection(nextDirection);
        requestVisitors(type, search, yearLevel, section, department, perPage, nextSort, nextDirection);
    };

    const visitPage = (url: string | null | undefined) => {
        if (url) {
            startTableLoading();
            router.visit(url, {
                preserveScroll: true,
                preserveState: true,
                onFinish: stopTableLoading,
            });
        }
    };

    return (
        <>
            <Head title="Registered Visitors" />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminLayout active="visitors">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Registered Visitors"
                            description="Manage RFID identities and active school-year details for students and employees."
                            actions={
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    <input
                                        ref={importInputRef}
                                        type="file"
                                        accept=".csv,.txt,.tsv,.xls,.xlsx,.xlsm,.docx,.pdf"
                                        className="hidden"
                                        onChange={(event) => previewImport(event.target.files?.[0] ?? null)}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => importInputRef.current?.click()}
                                        disabled={importing}
                                        className="w-full sm:w-auto"
                                    >
                                        <Upload className="size-4" />
                                        {importing ? 'Importing...' : 'Import'}
                                    </Button>
                                    <Button type="button" onClick={openCreateVisitor} className="w-full sm:w-auto">
                                        <Plus className="size-4" />
                                        Add visitor
                                    </Button>
                                </div>
                            }
                        />

                        <VisitorsTable
                            visitors={visitors}
                            activeType={activeType}
                            search={search}
                            yearLevel={yearLevel}
                            section={section}
                            department={department}
                            yearLevels={filterOptions.yearLevels}
                            sections={availableSections}
                            departments={filterOptions.departments}
                            rowsPerPage={perPage}
                            sort={sort}
                            direction={direction}
                            isLoading={tableLoading}
                            onSearchChange={setSearch}
                            onTypeChange={changeType}
                            onYearLevelChange={changeYearLevel}
                            onSectionChange={changeSection}
                            onDepartmentChange={changeDepartment}
                            onRowsPerPageChange={setPerPage}
                            onSortChange={changeSort}
                            onSortClear={clearSort}
                            onEdit={openEditVisitor}
                            onPrevious={() =>
                                visitPage(visitors.prev_page_url ?? visitors.links.find((link) => link.label.includes('Previous'))?.url)
                            }
                            onNext={() => visitPage(visitors.next_page_url ?? visitors.links.find((link) => link.label.includes('Next'))?.url)}
                            onPageChange={(page) =>
                                requestVisitors(activeType, search, yearLevel, section, department, perPage, sort, direction, true, page)
                            }
                        />
                        {importError && (
                            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{importError}</p>
                        )}
                    </div>

                    <VisitorFormModal
                        visitor={selectedVisitor}
                        open={visitorFormOpen}
                        sectionsByYearLevel={filterOptions.sectionsByYearLevel}
                        onOpenChange={setVisitorFormOpen}
                    />
                    <ImportPreviewDialog
                        open={importPreviewOpen}
                        preview={importPreview}
                        processing={importing}
                        onCancel={cancelImport}
                        onConfirm={confirmImport}
                    />
                    {importing && (
                        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white/75 backdrop-blur-sm">
                            <div className="w-[min(92vw,26rem)] rounded-xl border border-[#040DBF]/15 bg-white p-6 text-center shadow-xl">
                                <div className="mx-auto size-10 animate-spin rounded-full border-4 border-[#040DBF]/15 border-t-[#040DBF]" />
                                <p className="mt-4 text-base font-semibold text-[#010440]">
                                    {importPreviewOpen ? 'Importing members...' : 'Reading import file...'}
                                </p>
                                <p className="mt-1 text-sm text-[#020659]/70">Please keep this page open while the roster is processed.</p>
                            </div>
                        </div>
                    )}
                </AdminLayout>
            </main>
        </>
    );
}

function ImportPreviewDialog({
    open,
    preview,
    processing,
    onCancel,
    onConfirm,
}: {
    open: boolean;
    preview: RegisteredVisitorImportPreview | null;
    processing: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const members = preview?.members ?? [];
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

                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <div className="relative min-w-0">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    value={importSearch}
                                    onChange={(event) => {
                                        setImportSearch(event.target.value);
                                        setScrollTop(0);
                                        tableScrollerRef.current?.scrollTo({ top: 0 });
                                    }}
                                    placeholder="Search name, school ID, or RFID"
                                    className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-9 pl-9 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                />
                                {importSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImportSearch('');
                                            setScrollTop(0);
                                            tableScrollerRef.current?.scrollTo({ top: 0 });
                                        }}
                                        className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                                        title="Clear search"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500">
                                Showing {displayedMembers.length} of {members.length}
                            </p>
                        </div>

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

                        {preview.skipped.length > 0 && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <p className="text-sm font-semibold text-amber-800">Skipped row preview</p>
                                <div className="mt-2 space-y-1">
                                    {preview.skipped.map((row, index) => (
                                        <p key={`${row.name}-${index}`} className="text-xs text-amber-800">
                                            {row.name}: {row.reason}
                                        </p>
                                    ))}
                                </div>
                            </div>
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

function ImportStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg bg-white px-3 py-2">
            <p className="text-xs font-medium text-[#020659]/65">{label}</p>
            <p className="mt-1 text-xl font-semibold text-[#010440]">{value}</p>
        </div>
    );
}

type ImportPreviewSort = 'status' | 'name' | 'type' | 'school_id' | 'rfid_uid' | 'year_level' | 'section';

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

function ImportPreviewRow({ member }: { member: RegisteredVisitorImportPreviewMember }) {
    const group = member.type === 'student' ? member.year_level || '-' : member.department || 'No department';
    const section = member.type === 'student' ? member.section || '-' : '-';
    const statusClasses = {
        create: 'bg-emerald-50 text-emerald-700',
        rfid: 'bg-blue-50 text-blue-700',
    } satisfies Record<RegisteredVisitorImportPreviewMember['status'], string>;
    const statusLabels = {
        create: 'New',
        rfid: 'Fill RFID',
    } satisfies Record<RegisteredVisitorImportPreviewMember['status'], string>;

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

function importSearchValue(member: RegisteredVisitorImportPreviewMember): string {
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

function importSortValue(member: RegisteredVisitorImportPreviewMember, column: ImportPreviewSort): string {
    if (column === 'year_level') {
        return member.type === 'student' ? (member.year_level ?? '') : (member.department ?? '');
    }

    return String(member[column] ?? '');
}

function compareImportValues(first: string, second: string): number {
    return first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });
}
