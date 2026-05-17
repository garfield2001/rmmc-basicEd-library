import { ImportPreviewDialog } from '@/components/admin/registered-visitors/import-preview-dialog';
import { VisitorFormModal } from '@/components/admin/registered-visitors/visitor-form-modal';
import { VisitorsTable } from '@/components/admin/registered-visitors/visitors-table';
import { Button } from '@/components/ui/button';
import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { csrfFetch } from '@/lib/http';
import { type Paginated } from '@/types/pagination';
import { type LibraryMemberImportPreview, type LibraryMemberRow } from '@/types/registered-visitors';
import { Head, router } from '@inertiajs/react';
import { Plus, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface VisitorsIndexProps {
    visitors: Paginated<LibraryMemberRow>;
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
    const [importPreview, setImportPreview] = useState<LibraryMemberImportPreview | null>(null);
    const [importPreviewOpen, setImportPreviewOpen] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [visitorFormOpen, setVisitorFormOpen] = useState(false);
    const [selectedVisitor, setselectedVisitor] = useState<LibraryMemberRow | null>(null);
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

    const openEditVisitor = (visitor: LibraryMemberRow) => {
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
