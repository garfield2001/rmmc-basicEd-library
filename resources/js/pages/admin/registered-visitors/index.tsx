import { VisitorFormModal } from '@/components/admin/registered-visitors/visitor-form-modal';
import { VisitorsTable } from '@/components/admin/registered-visitors/visitors-table';
import { Button } from '@/components/ui/button';
import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type Paginated } from '@/types/pagination';
import { type RegisteredVisitorRow } from '@/types/registered-visitors';
import { Head, router } from '@inertiajs/react';
import { Plus, Upload } from 'lucide-react';
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
    };

    const openCreateVisitor = () => {
        setselectedVisitor(null);
        setVisitorFormOpen(true);
    };

    const openEditVisitor = (visitor: RegisteredVisitorRow) => {
        setselectedVisitor(visitor);
        setVisitorFormOpen(true);
    };

    const importVisitors = (file: File | null) => {
        if (!file) {
            return;
        }

        setImporting(true);
        router.post(
            '/admin/registered-visitors/import',
            { visitors_file: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    setImporting(false);

                    if (importInputRef.current) {
                        importInputRef.current.value = '';
                    }
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
                                        accept=".csv,.txt,.xls,.xlsx"
                                        className="hidden"
                                        onChange={(event) => importVisitors(event.target.files?.[0] ?? null)}
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
                            onSectionChange={setSection}
                            onDepartmentChange={setDepartment}
                            onRowsPerPageChange={setPerPage}
                            onSortChange={changeSort}
                            onSortClear={clearSort}
                            onEdit={openEditVisitor}
                            onPrevious={() => visitPage(visitors.prev_page_url ?? visitors.links.find((link) => link.label.includes('Previous'))?.url)}
                            onNext={() => visitPage(visitors.next_page_url ?? visitors.links.find((link) => link.label.includes('Next'))?.url)}
                        />
                    </div>

                    <VisitorFormModal
                        visitor={selectedVisitor}
                        open={visitorFormOpen}
                        sectionsByYearLevel={filterOptions.sectionsByYearLevel}
                        onOpenChange={setVisitorFormOpen}
                    />
                </AdminLayout>
            </main>
        </>
    );
}
