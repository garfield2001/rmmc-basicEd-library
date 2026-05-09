import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SelectInput } from '@/components/ui/select-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type LibraryMemberRow } from '@/types/members';
import { type Paginated } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, ArchiveRestore, BriefcaseBusiness, Download, GraduationCap, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface MembersArchiveProps {
    members: Paginated<LibraryMemberRow>;
    filters: {
        search: string;
        type: 'student' | 'employee';
        year_level: string;
        section: string;
        department: string;
        status: string;
    };
    filterOptions: {
        yearLevels: string[];
        sectionsByYearLevel: Record<string, string[]>;
        departments: string[];
    };
}

type MemberType = 'student' | 'employee';

export default function MembersArchive({ members, filters, filterOptions }: MembersArchiveProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [yearLevel, setYearLevel] = useState(filters.year_level ?? '');
    const [section, setSection] = useState(filters.section ?? '');
    const [department, setDepartment] = useState(filters.department ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [tableLoading, setTableLoading] = useState(false);
    const [memberToRestore, setMemberToRestore] = useState<LibraryMemberRow | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<LibraryMemberRow | null>(null);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [processingAction, setProcessingAction] = useState<'restore' | 'delete' | null>(null);
    const activeType = filters.type === 'employee' ? 'employee' : 'student';
    const currentPage = members.meta?.current_page ?? members.current_page ?? 1;
    const totalPages = members.meta?.last_page ?? members.last_page ?? 1;
    const from = members.meta?.from ?? members.from ?? 0;
    const to = members.meta?.to ?? members.to ?? 0;
    const total = members.meta?.total ?? members.total ?? members.data.length;
    const availableSections = useMemo(() => {
        return yearLevel ? (filterOptions.sectionsByYearLevel[yearLevel] ?? []) : [];
    }, [filterOptions.sectionsByYearLevel, yearLevel]);
    const selectedCount = selectedMemberIds.length;
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

    const archiveQuery = (type: MemberType, deleteAfterExport = false) => ({
        type,
        search: search || undefined,
        year_level: type === 'student' ? yearLevel || undefined : undefined,
        section: type === 'student' && yearLevel ? section || undefined : undefined,
        department: type === 'employee' ? department || undefined : undefined,
        status: status || undefined,
        delete_after_export: deleteAfterExport ? 1 : undefined,
    });

    const exportUrl = (deleteAfterExport = false) => {
        const params = new URLSearchParams();
        Object.entries(archiveQuery(activeType, deleteAfterExport)).forEach(([key, value]) => {
            if (value !== undefined) {
                params.set(key, String(value));
            }
        });

        return `/admin/members/archive/export?${params.toString()}`;
    };

    const visitArchive = (type: MemberType) => {
        startTableLoading();
        setSelectedMemberIds([]);
        router.get('/admin/members/archive', archiveQuery(type), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            onFinish: stopTableLoading,
        });
    };

    const changeYearLevel = (value: string) => {
        setYearLevel(value);
        setSection('');
    };

    const restoreMember = (member: LibraryMemberRow) => {
        const memberId = member.id;

        setMemberToRestore(null);
        setProcessingAction('restore');
        router.patch(
            `/admin/members/archive/${memberId}/restore`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingAction(null),
            },
        );
    };

    const permanentlyDeleteMember = (member: LibraryMemberRow) => {
        const memberId = member.id;

        setMemberToDelete(null);
        setProcessingAction('delete');
        router.delete(`/admin/members/archive/${memberId}`, {
            preserveScroll: true,
            onFinish: () => setProcessingAction(null),
        });
    };

    const permanentlyDeleteSelectedMembers = () => {
        setBulkDeleteOpen(false);
        setProcessingAction('delete');
        router.delete('/admin/members/archive/bulk', {
            data: {
                member_ids: selectedMemberIds,
                type: activeType,
            },
            preserveScroll: true,
            onFinish: () => setProcessingAction(null),
            onSuccess: () => setSelectedMemberIds([]),
        });
    };

    const toggleMemberSelection = (memberId: number) => {
        setSelectedMemberIds((current) => (current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]));
    };

    const togglePageSelection = () => {
        const pageIds = members.data.map((member) => member.id);
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedMemberIds.includes(id));

        setSelectedMemberIds((current) =>
            allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])),
        );
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
                                    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setExportDialogOpen(true)}>
                                        <Download className="size-4" />
                                        Export Excel
                                    </Button>
                                </div>
                            }
                        />

                        <section className="admin-surface rounded-xl border border-[#040DBF]/10 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="admin-segmented-tabs">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeType === tab.value;

                                        return (
                                            <button
                                                key={tab.value}
                                                type="button"
                                                onClick={() => visitArchive(tab.value)}
                                                className={`admin-segmented-tab ${isActive ? 'admin-segmented-tab-active' : ''}`}
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
                                        visitArchive(activeType);
                                    }}
                                    className="grid flex-1 gap-3 lg:max-w-4xl lg:grid-cols-[minmax(0,1fr)_9rem] xl:grid-cols-[minmax(0,1fr)_12rem_12rem_10rem_9rem]"
                                >
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder="Search archived members"
                                            className="h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-3 pl-9 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                                        />
                                    </div>
                                    {activeType === 'student' ? (
                                        <>
                                            <FilterSelect
                                                value={yearLevel}
                                                options={filterOptions.yearLevels}
                                                placeholder="All year levels"
                                                onChange={changeYearLevel}
                                            />
                                            <FilterSelect
                                                value={section}
                                                options={availableSections}
                                                placeholder={yearLevel ? 'All sections' : 'Choose year'}
                                                disabled={!yearLevel}
                                                onChange={setSection}
                                            />
                                        </>
                                    ) : (
                                        <FilterSelect
                                            value={department}
                                            options={filterOptions.departments}
                                            placeholder="All departments"
                                            onChange={setDepartment}
                                        />
                                    )}
                                    <FilterSelect
                                        value={status}
                                        options={['active', 'inactive']}
                                        labels={{ active: 'Active', inactive: 'Inactive' }}
                                        placeholder="All statuses"
                                        onChange={setStatus}
                                    />
                                    <Button type="submit">Apply</Button>
                                </form>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            {selectedCount > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#040DBF]/10 bg-[#f6f8ff] px-5 py-3">
                                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#020659] shadow-sm">
                                        {selectedCount.toLocaleString()} selected
                                    </span>
                                    <Button type="button" variant="danger" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                                        <Trash2 className="size-4" />
                                        Delete selected permanently
                                    </Button>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <Table className="min-w-[920px]">
                                    <TableHeader className="bg-zinc-50">
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        members.data.length > 0 &&
                                                        members.data.every((member) => selectedMemberIds.includes(member.id))
                                                    }
                                                    disabled={tableLoading || members.data.length === 0}
                                                    onChange={togglePageSelection}
                                                    className="size-4 rounded border-zinc-300"
                                                    aria-label="Select archived members on this page"
                                                />
                                            </TableHead>
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
                                                    <TableCell>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMemberIds.includes(member.id)}
                                                            onChange={() => toggleMemberSelection(member.id)}
                                                            className="size-4 rounded border-zinc-300"
                                                            aria-label={`Select ${member.name}`}
                                                        />
                                                    </TableCell>
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
                                                <TableCell colSpan={7} className="px-5 py-14 text-center text-sm text-zinc-500">
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
                        onOpenChange={(open) => !open && setMemberToRestore(null)}
                        onConfirm={(member) => member && restoreMember(member)}
                    />
                    <ArchiveActionDialog
                        member={null}
                        count={selectedCount}
                        action="bulk-delete"
                        processing={processingAction === 'delete'}
                        open={bulkDeleteOpen}
                        onOpenChange={(open) => !open && setBulkDeleteOpen(false)}
                        onConfirm={permanentlyDeleteSelectedMembers}
                    />
                    <ExportArchiveDialog
                        open={exportDialogOpen}
                        onOpenChange={setExportDialogOpen}
                        exportOnlyUrl={exportUrl(false)}
                        exportAndDeleteUrl={exportUrl(true)}
                    />
                    <ArchiveActionDialog
                        member={memberToDelete}
                        action="delete"
                        processing={processingAction === 'delete'}
                        open={Boolean(memberToDelete)}
                        onOpenChange={(open) => !open && setMemberToDelete(null)}
                        onConfirm={(member) => member && permanentlyDeleteMember(member)}
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
                        <SkeletonBlock className="size-4 rounded" />
                    </TableCell>
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

function FilterSelect({
    value,
    options,
    labels = {},
    placeholder,
    disabled = false,
    onChange,
}: {
    value: string;
    options: string[];
    labels?: Record<string, string>;
    placeholder: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <SelectInput
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className="border-[#040DBF]/15 text-[#020659] focus:border-[#040DBF] focus:ring-[#040DBF]/10"
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {labels[option] ?? option}
                </option>
            ))}
        </SelectInput>
    );
}

function ExportArchiveDialog({
    open,
    onOpenChange,
    exportOnlyUrl,
    exportAndDeleteUrl,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exportOnlyUrl: string;
    exportAndDeleteUrl: string;
}) {
    const exportArchive = (url: string) => {
        onOpenChange(false);
        window.location.href = url;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-[#f6f8ff] text-[#030A8C]">
                        <Download className="size-5" />
                    </div>
                    <DialogTitle className="text-2xl text-[#010440]">Export archived members?</DialogTitle>
                    <DialogDescription>
                        Export the currently filtered archived members. You can keep the exported records archived, or permanently delete those
                        exported records after the file is prepared.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => exportArchive(exportOnlyUrl)}>
                        Export only
                    </Button>
                    <Button type="button" variant="danger" onClick={() => exportArchive(exportAndDeleteUrl)}>
                        Export and delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ArchiveActionDialog({
    member,
    count = 0,
    action,
    processing,
    open,
    onOpenChange,
    onConfirm,
}: {
    member: LibraryMemberRow | null;
    count?: number;
    action: 'restore' | 'delete' | 'bulk-delete';
    processing: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (member: LibraryMemberRow | null) => void;
}) {
    const isDelete = action === 'delete' || action === 'bulk-delete';
    const Icon = isDelete ? AlertTriangle : RotateCcw;

    const confirm = () => {
        if (action === 'bulk-delete') {
            onConfirm(null);
            return;
        }

        if (member) {
            onConfirm(member);
        }
    };
    const title = action === 'bulk-delete' ? 'Permanently delete selected?' : isDelete ? 'Permanently delete member?' : 'Restore member?';
    const description =
        action === 'bulk-delete'
            ? `This will permanently delete ${count} selected archived ${count === 1 ? 'member' : 'members'} from the app. Export first if you need an offline copy.`
            : isDelete
              ? `This will permanently delete ${member?.name ?? 'this member'} and their archived records from the app. Export the archive first if you need an offline copy.`
              : `This will restore ${member?.name ?? 'this member'} to Active Members so they can be managed and scanned again when eligible.`;

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
                    <DialogTitle className="text-2xl text-[#010440]">{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
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
