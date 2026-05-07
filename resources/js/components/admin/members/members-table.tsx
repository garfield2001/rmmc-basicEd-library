import { PaginationControls } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LibraryMemberRow } from '@/types/members';
import type { Paginated } from '@/types/pagination';
import { Pencil, Trash2 } from 'lucide-react';

type MemberType = 'student' | 'employee';

interface MembersTableProps {
    members: Paginated<LibraryMemberRow>;
    activeType: MemberType;
    onEdit: (member: LibraryMemberRow) => void;
    onDelete: (member: LibraryMemberRow) => void;
    onPrevious: () => void;
    onNext: () => void;
}

export function MembersTable({ members, activeType, onEdit, onDelete, onPrevious, onNext }: MembersTableProps) {
    const currentPage = members.meta?.current_page ?? members.current_page ?? 1;
    const totalPages = members.meta?.last_page ?? members.last_page ?? 1;
    const from = members.meta?.from ?? members.from ?? 0;
    const to = members.meta?.to ?? members.to ?? 0;
    const total = members.meta?.total ?? members.total ?? members.data.length;

    return (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
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
                                        <MemberIdentity member={member} />
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
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                            {member.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <ActionButton label="Edit member" icon={Pencil} onClick={() => onEdit(member)} />
                                            <ActionButton label="Delete member" icon={Trash2} onClick={() => onDelete(member)} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={activeType === 'student' ? 7 : 6} className="px-5 py-14 text-center text-sm text-zinc-500">
                                    No {activeType === 'student' ? 'students' : 'employees'} found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} from={from ?? 0} to={to ?? 0} total={total} onPrevious={onPrevious} onNext={onNext} />
        </div>
    );
}

function MemberIdentity({ member }: { member: LibraryMemberRow }) {
    return (
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
            <p className="min-w-0 font-medium">{member.name}</p>
        </div>
    );
}

function ActionButton({ label, icon: Icon, onClick }: { label: string; icon: typeof Pencil; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
            title={label}
        >
            <Icon className="size-4" />
        </button>
    );
}
