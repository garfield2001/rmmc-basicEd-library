import { DeleteMemberDialog } from '@/components/admin/members/delete-member-dialog';
import { MemberFormModal } from '@/components/admin/members/member-form-modal';
import { MembersFilterBar } from '@/components/admin/members/members-filter-bar';
import { MembersTable } from '@/components/admin/members/members-table';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type LibraryMemberRow } from '@/types/members';
import { type Paginated } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface MembersIndexProps {
    members: Paginated<LibraryMemberRow>;
    filters: {
        search: string;
        type: 'student' | 'employee';
        year_level: string;
        section: string;
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
    const [memberFormOpen, setMemberFormOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<LibraryMemberRow | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<LibraryMemberRow | null>(null);
    const activeType: MemberType = filters.type === 'employee' ? 'employee' : 'student';
    const availableSections = useMemo(() => {
        return yearLevel ? (filterOptions.sectionsByYearLevel[yearLevel] ?? []) : [];
    }, [filterOptions.sectionsByYearLevel, yearLevel]);

    const requestMembers = useCallback((type: MemberType, nextSearch: string, nextYearLevel: string, nextSection: string) => {
        router.get(
            '/admin/members',
            {
                search: nextSearch || undefined,
                type,
                year_level: type === 'student' ? nextYearLevel || undefined : undefined,
                section: type === 'student' && nextYearLevel ? nextSection || undefined : undefined,
            },
            { preserveState: true, replace: true },
        );
    }, []);

    useEffect(() => {
        const normalizedSection = yearLevel ? section : '';
        const matchesFilters =
            filters.search === search && filters.year_level === yearLevel && filters.section === normalizedSection && filters.type === activeType;

        if (matchesFilters) {
            return;
        }

        const filterTimer = window.setTimeout(() => {
            requestMembers(activeType, search, yearLevel, normalizedSection);
        }, 300);

        return () => window.clearTimeout(filterTimer);
    }, [activeType, filters.search, filters.section, filters.type, filters.year_level, requestMembers, search, section, yearLevel]);

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

    const visitPage = (url: string | null | undefined) => {
        if (url) {
            router.visit(url, { preserveScroll: true, preserveState: true });
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
                                <Button type="button" onClick={openCreateMember} className="w-full sm:w-auto">
                                    <Plus className="size-4" />
                                    Add member
                                </Button>
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
                            onTypeChange={(type) => requestMembers(type, search, yearLevel, section)}
                        />

                        <MembersTable
                            members={members}
                            activeType={activeType}
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
