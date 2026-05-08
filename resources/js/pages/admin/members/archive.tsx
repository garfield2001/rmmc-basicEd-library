import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type LibraryMemberRow } from '@/types/members';
import { type Paginated } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, ArchiveRestore, BriefcaseBusiness, Download, GraduationCap, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface MembersArchiveProps {
    members: Paginated<LibraryMemberRow>;
    filters: {
        search: string;
        type: 'student' | 'employee';
    };
}

type MemberType = 'student' | 'employee';

export default function MembersArchive({ members, filters }: MembersArchiveProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [tableLoading, setTableLoading] = useState(false);
    const [memberToRestore, setMemberToRestore] = useState<LibraryMemberRow | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<LibraryMemberRow | null>(null);
    const [processingAction, setProcessingAction] = useState<'restore' | 'delete' | null>(null);
    const activeType = filters.type === 'employee' ? 'employee' : 'student';
    const currentPage = members.meta?.current_page ?? members.current_page ?? 1;
    const totalPages = members.meta?.last_page ?? members.last_page ?? 1;
    const from = members.meta?.from ?? members.from ?? 0;
    const to = members.meta?.to ?? members.to ?? 0;
    const total = members.meta?.total ?? members.total ?? members.data.length;
    const exportUrl = `/admin/members/archive/export?type=${activeType}${filters.search ? `&search=${encodeURIComponent(filters.search)}` : ''}`;
    const tabs = [
        { label: 'Students', value: 'student' as const, icon: GraduationCap },
        { label: 'Employees', value: 'employee' as const, icon: BriefcaseBusiness },
    ];

    const startTableLoading = () => {
        setTableLoading(true);
    };

    const stopTableLoading = () => {
        setTableLoading(false);
    };

    const visitArchive = (type: MemberType, nextSearch = search) => {
        startTableLoading();
        router.get(
            '/admin/members/archive',
            {
                type,
                search: nextSearch || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onFinish: stopTableLoading,
            },
        );
    };

    const restoreMember = (member: LibraryMemberRow) => {
        setProcessingAction('restore');
        router.patch(`/admin/members/archive/${member.id}/restore`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingAction(null),
            onSuccess: () => setMemberToRestore(null),
        });
    };

    const permanentlyDeleteMember = (member: LibraryMemberRow) => {
        setProcessingAction('delete');
        router.delete(`/admin/members/archive/${member.id}`, {
            preserveScroll: true,
            onFinish: () => setProcessingAction(null),
            onSuccess: () => setMemberToDelete(null),
        });
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
            <Head title="Archived Members" />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminLayout active="archive">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Archived Members"
                            description="Restore deleted library members or export archived records before permanent deletion."
                            actions={
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    <Button asChild variant="outline" className="w-full sm:w-auto">
                                        <a href={exportUrl}>
                                            <Download className="size-4" />
                                            Export Excel
                                        </a>
                                    </Button>
                                </div>
                            }
                        />

                        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeType === tab.value;

                                        return (
                                            <button
                                                key={tab.value}
                                                type="button"
                                                onClick={() => visitArchive(tab.value)}
                                                className={`flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition ${
                                                    isActive ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                                                }`}
                                            >
                                                <Icon className="size-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        visitArchive(activeType, search);
                                    }}
                                    className="relative flex-1 lg:max-w-xl"
                                >
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search archived members"
                                        className="h-10 w-full rounded-lg border border-zinc-300 pr-3 pl-9 text-sm outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                    />
                                </form>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <Table className="min-w-[920px]">
                                    <TableHeader className="bg-zinc-50">
                                        <TableRow>
                                            <TableHead>Archived at</TableHead>
                                            <TableHead>School ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>{activeType === 'student' ? 'Year / Section' : 'Department'}</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tableLoading ? (
                                            <ArchiveLoadingRows />
                                        ) : members.data.length > 0 ? (
                                            members.data.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell className="text-zinc-500">{formatDate(member.deleted_at)}</TableCell>
                                                    <TableCell className="font-medium">{member.school_id}</TableCell>
                                                    <TableCell>{member.name}</TableCell>
                                                    <TableCell className="text-zinc-500">
                                                        {member.type === 'student'
                                                            ? [member.student?.year_level, member.student?.section].filter(Boolean).join(' / ') || '-'
                                                            : member.employee?.department || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                                                            }`}
                                                        >
                                                            {member.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end gap-2">
                                                            <IconActionButton
                                                                label="Restore member"
                                                                icon={RotateCcw}
                                                                onClick={() => setMemberToRestore(member)}
                                                            />
                                                            <IconActionButton
                                                                label="Permanently delete member"
                                                                icon={Trash2}
                                                                danger
                                                                onClick={() => setMemberToDelete(member)}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="px-5 py-14 text-center text-sm text-zinc-500">
                                                    <ArchiveRestore className="mx-auto mb-3 size-8 text-zinc-400" />
                                                    No archived {activeType === 'student' ? 'students' : 'employees'} found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                from={from ?? 0}
                                to={to ?? 0}
                                total={total}
                                onPrevious={() =>
                                    visitPage(members.prev_page_url ?? members.links.find((link) => link.label.includes('Previous'))?.url)
                                }
                                onNext={() => visitPage(members.next_page_url ?? members.links.find((link) => link.label.includes('Next'))?.url)}
                            />
                        </section>
                    </div>

                    <ArchiveActionDialog
                        member={memberToRestore}
                        action="restore"
                        processing={processingAction === 'restore'}
                        open={Boolean(memberToRestore)}
                        onOpenChange={(open) => !open && !processingAction && setMemberToRestore(null)}
                        onConfirm={restoreMember}
                    />
                    <ArchiveActionDialog
                        member={memberToDelete}
                        action="delete"
                        processing={processingAction === 'delete'}
                        open={Boolean(memberToDelete)}
                        onOpenChange={(open) => !open && !processingAction && setMemberToDelete(null)}
                        onConfirm={permanentlyDeleteMember}
                    />
                </AdminLayout>
            </main>
        </>
    );
}

function ArchiveLoadingRows() {
    return (
        <>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                    <TableCell>
                        <SkeletonBlock className="h-3.5 w-32 rounded-full" />
                    </TableCell>
                    <TableCell>
                        <SkeletonBlock className="h-3.5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                        <div className="space-y-2">
                            <SkeletonBlock className="h-3.5 w-40 rounded-full" />
                            <SkeletonBlock className="h-3 w-24 rounded-full" />
                        </div>
                    </TableCell>
                    <TableCell>
                        <SkeletonBlock className="h-3.5 w-28 rounded-full" />
                    </TableCell>
                    <TableCell>
                        <SkeletonBlock className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                        <div className="flex justify-end gap-2">
                            <SkeletonBlock className="size-9 rounded-lg" />
                            <SkeletonBlock className="size-9 rounded-lg" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse bg-zinc-200/80 ${className}`} />;
}

function ArchiveActionDialog({
    member,
    action,
    processing,
    open,
    onOpenChange,
    onConfirm,
}: {
    member: LibraryMemberRow | null;
    action: 'restore' | 'delete';
    processing: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (member: LibraryMemberRow) => void;
}) {
    const isDelete = action === 'delete';
    const Icon = isDelete ? AlertTriangle : RotateCcw;

    const confirm = () => {
        if (member) {
            onConfirm(member);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div
                        className={`mb-2 flex size-11 items-center justify-center rounded-lg ${
                            isDelete ? 'bg-red-50 text-red-600' : 'bg-[#f6f8ff] text-[#030A8C]'
                        }`}
                    >
                        <Icon className="size-5" />
                    </div>
                    <DialogTitle className="text-2xl text-[#010440]">{isDelete ? 'Permanently delete member?' : 'Restore member?'}</DialogTitle>
                    <DialogDescription>
                        {isDelete
                            ? `This will permanently delete ${member?.name ?? 'this member'} and their archived records from the app. Export the archive first if you need an offline copy.`
                            : `This will restore ${member?.name ?? 'this member'} to Active Members so they can be managed and scanned again when eligible.`}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" variant={isDelete ? 'danger' : 'default'} onClick={confirm} disabled={processing}>
                        {processing ? (isDelete ? 'Deleting...' : 'Restoring...') : isDelete ? 'Delete permanently' : 'Restore member'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function formatDate(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function IconActionButton({
    label,
    icon: Icon,
    danger = false,
    onClick,
}: {
    label: string;
    icon: typeof RotateCcw;
    danger?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            className={`inline-flex size-9 items-center justify-center rounded-lg border transition-[background-color,border-color,color,box-shadow] hover:shadow-sm ${
                danger
                    ? 'border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700'
                    : 'border-[#040DBF]/15 text-[#020659] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440]'
            }`}
        >
            <Icon className="size-4" />
        </button>
    );
}
