import { AdminPageHeader, AdminShell } from '@/components/admin-shell';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type LibraryMemberRow, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { BriefcaseBusiness, GraduationCap, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';

interface MembersIndexProps {
    members: Paginated<LibraryMemberRow>;
    filters: {
        search: string;
        type: 'student' | 'employee';
    };
}

type MemberType = 'student' | 'employee';

export default function MembersIndex({ members, filters }: MembersIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const activeType: MemberType = filters.type === 'employee' ? 'employee' : 'student';

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        router.get(
            '/admin/members',
            {
                search: search || undefined,
                type: activeType,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const removeMember = (member: LibraryMemberRow) => {
        if (window.confirm(`Delete ${member.name}? This will also remove related visit ownership links.`)) {
            router.delete(`/admin/members/${member.id}`);
        }
    };

    const changeType = (type: MemberType) => {
        router.get(
            '/admin/members',
            {
                search: search || undefined,
                type,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const tabs: { label: string; value: MemberType; icon: typeof GraduationCap }[] = [
        { label: 'Students', value: 'student', icon: GraduationCap },
        { label: 'Employees', value: 'employee', icon: BriefcaseBusiness },
    ];

    return (
        <>
            <Head title="Library Members" />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminShell active="members">
                    <div className="space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Library Members"
                            description="Manage RFID identities and library visit profiles for students and employees."
                            actions={
                                <Link
                                    href="/admin/members/create"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                                >
                                    <Plus className="size-4" />
                                    Add member
                                </Link>
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
                                                onClick={() => changeType(tab.value)}
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

                                <form onSubmit={submit} className="flex flex-1 flex-col gap-3 sm:flex-row lg:max-w-xl">
                                    <div className="relative flex-1">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder={`Search ${activeType === 'student' ? 'students' : 'employees'}`}
                                            className="h-10 w-full rounded-lg border border-zinc-300 pr-3 pl-9 text-sm outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="h-10 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                                    >
                                        Filter
                                    </button>
                                </form>
                            </div>
                        </section>

                        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <Table className={activeType === 'student' ? 'min-w-225' : 'min-w-200'}>
                                <TableHeader className="bg-zinc-50">
                                    <TableRow>
                                        <TableHead>{activeType === 'student' ? 'Student' : 'Employee'}</TableHead>
                                        <TableHead>School ID</TableHead>
                                        <TableHead>RFID</TableHead>
                                        {activeType === 'student' ? (
                                            <>
                                                <TableHead>Year level</TableHead>
                                                <TableHead>Section</TableHead>
                                            </>
                                        ) : (
                                            <TableHead>Department</TableHead>
                                        )}
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.data.length > 0 ? (
                                        members.data.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-500">
                                                            {member.photo_url ? (
                                                                <img src={member.photo_url} alt="" className="size-full object-cover" />
                                                            ) : (
                                                                member.name
                                                                    .split(' ')
                                                                    .map((part) => part[0])
                                                                    .join('')
                                                                    .slice(0, 2)
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium">{member.name}</p>
                                                            <p className="truncate text-xs text-zinc-500">{member.photo || 'No photo file'}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{member.school_id}</TableCell>
                                                <TableCell className="text-zinc-500">{member.rfid_uid}</TableCell>
                                                {activeType === 'student' ? (
                                                    <>
                                                        <TableCell className="text-zinc-500">{member.student?.year_level || '-'}</TableCell>
                                                        <TableCell className="text-zinc-500">{member.student?.section || '-'}</TableCell>
                                                    </>
                                                ) : (
                                                    <TableCell className="text-zinc-500">{member.employee?.department || '-'}</TableCell>
                                                )}
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
                                                        <Link
                                                            href={`/admin/members/${member.id}/edit`}
                                                            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                                                            title="Edit member"
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMember(member)}
                                                            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                                                            title="Delete member"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={activeType === 'student' ? 7 : 6}
                                                className="px-5 py-14 text-center text-sm text-zinc-500"
                                            >
                                                No {activeType === 'student' ? 'students' : 'employees'} found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </AdminShell>
            </main>
        </>
    );
}
