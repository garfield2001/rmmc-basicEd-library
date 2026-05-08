import { BulkStudentAssignmentPanel } from '@/components/admin/members/bulk-student-assignment-panel';
import { DeleteMemberDialog } from '@/components/admin/members/delete-member-dialog';
import { MemberFormModal } from '@/components/admin/members/member-form-modal';
import { MembersFilterBar } from '@/components/admin/members/members-filter-bar';
import { MembersTable } from '@/components/admin/members/members-table';
import { Button } from '@/components/ui/button';
import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type LibraryMemberRow } from '@/types/members';
import { type Paginated } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { ClipboardList, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface MembersIndexProps {
    members: Paginated<LibraryMemberRow>;
    filters: {
        search: string;
        type: 'student' | 'employee';
        year_level: string;
        section: string;
        sort: string;
        direction: 'asc' | 'desc';
        per_page: RowsPerPageOption;
    };
    filterOptions: {
        yearLevels: string[];
        sectionsByYearLevel: Record<string, string[]>;
    };
}

type MemberType = 'student' | 'employee';

export default function MembersIndex({ members, filters, filterOptions }: MembersIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [yearLevel, setYearLevel] = useState(filters.year_level ?? '');
    const [section, setSection] = useState(filters.section ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'created_at');
    const [direction, setDirection] = useState<'asc' | 'desc'>(filters.direction === 'asc' ? 'asc' : 'desc');
    const [perPage, setPerPage] = useState<RowsPerPageOption>(filters.per_page ?? 5);
    const [tableLoading, setTableLoading] = useState(false);
    const [memberFormOpen, setMemberFormOpen] = useState(false);
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<LibraryMemberRow | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<LibraryMemberRow | null>(null);
    const activeType: MemberType = filters.type === 'employee' ? 'employee' : 'student';
    const availableSections = useMemo(() => {
        return yearLevel ? (filterOptions.sectionsByYearLevel[yearLevel] ?? []) : [];
    }, [filterOptions.sectionsByYearLevel, yearLevel]);

    const requestMembers = useCallback(
        (
            type: MemberType,
            nextSearch: string,
            nextYearLevel: string,
            nextSection: string,
            nextPerPage: RowsPerPageOption,
            nextSort = sort,
            nextDirection = direction,
        ) => {
            setTableLoading(true);
            router.get(
                '/admin/members',
                {
                    search: nextSearch || undefined,
                    type,
                    year_level: type === 'student' ? nextYearLevel || undefined : undefined,
                    section: type === 'student' && nextYearLevel ? nextSection || undefined : undefined,
                    sort: nextSort === 'created_at' ? undefined : nextSort,
                    direction: nextSort === 'created_at' && nextDirection === 'desc' ? undefined : nextDirection,
                    per_page: nextPerPage,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => setTableLoading(false),
                },
            );
        },
        [direction, sort],
    );

    useEffect(() => {
        const normalizedSection = yearLevel ? section : '';
        const matchesFilters =
            filters.search === search &&
            filters.year_level === yearLevel &&
            filters.section === normalizedSection &&
            filters.type === activeType &&
            filters.sort === sort &&
            filters.direction === direction &&
            filters.per_page === perPage;

        if (matchesFilters) {
            return;
        }

        const filterTimer = window.setTimeout(() => {
            requestMembers(activeType, search, yearLevel, normalizedSection, perPage);
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
        perPage,
        requestMembers,
        search,
        section,
        sort,
        direction,
        yearLevel,
    ]);

    const changeYearLevel = (value: string) => {
        setYearLevel(value);
        setSection('');
    };

    const openCreateMember = () => {
        setSelectedMember(null);
        setMemberFormOpen(true);
    };

    const openEditMember = (member: LibraryMemberRow) => {
        setSelectedMember(member);
        setMemberFormOpen(true);
    };

    const changeSort = (column: string) => {
        const nextDirection = sort === column && direction === 'asc' ? 'desc' : 'asc';

        setSort(column);
        setDirection(nextDirection);
        requestMembers(activeType, search, yearLevel, section, perPage, column, nextDirection);
    };

    const sortForType = (type: MemberType) => {
        if (type === 'student' && sort === 'department') {
            return 'created_at';
        }

        if (type === 'employee' && ['year_level', 'section'].includes(sort)) {
            return 'created_at';
        }

        return sort;
    };

    const changeType = (type: MemberType) => {
        const nextSort = sortForType(type);
        const nextDirection = nextSort === 'created_at' ? 'desc' : direction;

        setSort(nextSort);
        setDirection(nextDirection);
        requestMembers(type, search, yearLevel, section, perPage, nextSort, nextDirection);
    };

    const visitPage = (url: string | null | undefined) => {
        if (url) {
            setTableLoading(true);
            router.visit(url, {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setTableLoading(false),
            });
        }
    };

    return (
        <>
            <Head title="Library Members" />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminLayout active="members">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Library Members"
                            description="Manage RFID identities and active school-year details for students and employees."
                            actions={
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    {activeType === 'student' ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setAssignmentModalOpen(true)}
                                            className="w-full sm:w-auto"
                                        >
                                            <ClipboardList className="size-4" />
                                            Assign students
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            aria-hidden="true"
                                            tabIndex={-1}
                                            className="invisible w-full sm:w-auto"
                                        >
                                            <ClipboardList className="size-4" />
                                            Assign students
                                        </Button>
                                    )}
                                    <Button type="button" onClick={openCreateMember} className="w-full sm:w-auto">
                                        <Plus className="size-4" />
                                        Add member
                                    </Button>
                                </div>
                            }
                        />

                        <MembersFilterBar
                            activeType={activeType}
                            search={search}
                            yearLevel={yearLevel}
                            section={section}
                            yearLevels={filterOptions.yearLevels}
                            sections={availableSections}
                            onSearchChange={setSearch}
                            onYearLevelChange={changeYearLevel}
                            onSectionChange={setSection}
                            onTypeChange={changeType}
                        />

                        {activeType === 'student' && (
                            <BulkStudentAssignmentPanel
                                open={assignmentModalOpen}
                                onOpenChange={setAssignmentModalOpen}
                                onAssigned={() => setAssignmentModalOpen(false)}
                            />
                        )}

                        <MembersTable
                            members={members}
                            activeType={activeType}
                            rowsPerPage={perPage}
                            sort={sort}
                            direction={direction}
                            isLoading={tableLoading}
                            copyFilters={{
                                search: filters.search ?? '',
                                type: activeType,
                                year_level: filters.year_level ?? '',
                                section: filters.year_level ? (filters.section ?? '') : '',
                                sort: filters.sort ?? 'created_at',
                                direction: filters.direction ?? 'desc',
                            }}
                            onRowsPerPageChange={setPerPage}
                            onSortChange={changeSort}
                            onEdit={openEditMember}
                            onDelete={setMemberToDelete}
                            onPrevious={() => visitPage(members.prev_page_url ?? members.links.find((link) => link.label.includes('Previous'))?.url)}
                            onNext={() => visitPage(members.next_page_url ?? members.links.find((link) => link.label.includes('Next'))?.url)}
                        />
                    </div>

                    <MemberFormModal
                        member={selectedMember}
                        open={memberFormOpen}
                        sectionsByYearLevel={filterOptions.sectionsByYearLevel}
                        onOpenChange={setMemberFormOpen}
                    />
                    <DeleteMemberDialog
                        member={memberToDelete}
                        open={Boolean(memberToDelete)}
                        onOpenChange={(open) => !open && setMemberToDelete(null)}
                    />
                </AdminLayout>
            </main>
        </>
    );
}
