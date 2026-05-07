import { PaginationControls } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LibraryMemberRow } from '@/types/members';
import type { Paginated } from '@/types/pagination';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from 'lucide-react';

type SortKey = 'name' | 'school_id' | 'source_year_level' | 'source_section' | 'target_year_level' | 'target_section';

interface EnrollmentTableProps {
    students: Paginated<LibraryMemberRow>;
    selectedIds: number[];
    allMatchingSelected: boolean;
    perPage: number;
    sort: string;
    direction: 'asc' | 'desc';
    search: string;
    onSelectedIdsChange: (ids: number[]) => void;
    onAllMatchingSelectedChange: (selected: boolean) => void;
    onPerPageChange: (rows: number) => void;
    onSortChange: (sort: SortKey) => void;
    onSearchChange: (search: string) => void;
    emptyMessage?: string;
}

export function EnrollmentTable({
    students,
    selectedIds,
    allMatchingSelected,
    perPage,
    sort,
    direction,
    search,
    onSelectedIdsChange,
    onAllMatchingSelectedChange,
    onPerPageChange,
    onSortChange,
    onSearchChange,
    emptyMessage = 'No student records match the current filters.',
}: EnrollmentTableProps) {
    const currentPage = students.meta?.current_page ?? students.current_page ?? 1;
    const totalPages = students.meta?.last_page ?? students.last_page ?? 1;
    const from = students.meta?.from ?? students.from ?? 0;
    const to = students.meta?.to ?? students.to ?? 0;
    const total = students.meta?.total ?? students.total ?? students.data.length;
    const allVisibleSelected = allMatchingSelected || (students.data.length > 0 && students.data.every((student) => selectedIds.includes(student.id)));

    const toggleAllVisible = () => {
        if (allMatchingSelected) {
            onAllMatchingSelectedChange(false);
            onSelectedIdsChange([]);
            return;
        }

        if (allVisibleSelected) {
            onSelectedIdsChange(selectedIds.filter((id) => !students.data.some((student) => student.id === id)));
            return;
        }

        onSelectedIdsChange([...new Set([...selectedIds, ...students.data.map((student) => student.id)])]);
    };

    const toggleStudent = (studentId: number) => {
        if (allMatchingSelected) {
            onAllMatchingSelectedChange(false);
            onSelectedIdsChange(students.data.filter((student) => student.id !== studentId).map((student) => student.id));
            return;
        }

        onSelectedIdsChange(selectedIds.includes(studentId) ? selectedIds.filter((id) => id !== studentId) : [...selectedIds, studentId]);
    };

    const visitPage = (url: string | null | undefined) => {
        if (url) {
            router.visit(url, { preserveScroll: true, preserveState: true });
        }
    };

    return (
        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
            <div className="border-b border-[#040DBF]/10 p-4">
                <div className="relative max-w-2xl">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/60" />
                    <input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search visible source students by name, school ID, or RFID"
                        className="h-11 w-full rounded-lg border-2 border-[#040DBF]/30 bg-white pr-3 pl-9 text-sm font-medium text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                    />
                </div>
            </div>
            {(allVisibleSelected || allMatchingSelected) && (
                <div className="border-b border-[#040DBF]/10 bg-[#f6f8ff] px-5 py-3 text-sm text-[#020659]">
                    {allMatchingSelected ? (
                        <span className="font-medium">All {total.toLocaleString()} matching students are selected.</span>
                    ) : (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span>{students.data.length} visible students are selected.</span>
                            <button
                                type="button"
                                onClick={() => onAllMatchingSelectedChange(true)}
                                className="inline-flex w-fit items-center rounded-lg bg-[#040DBF] px-3 py-2 text-left font-semibold text-white shadow-sm hover:bg-[#030A8C]"
                            >
                                Select all {total.toLocaleString()} matching students
                            </button>
                        </div>
                    )}
                </div>
            )}
            <div className="overflow-x-auto">
                <Table className="min-w-[980px]">
                    <TableHeader className="bg-[#f6f8ff]">
                        <TableRow>
                            <TableHead>
                                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="size-4 rounded border-[#040DBF]/20" />
                            </TableHead>
                            <SortableHead label="Student" sortKey="name" activeSort={sort} direction={direction} onSortChange={onSortChange} />
                            <SortableHead label="School ID" sortKey="school_id" activeSort={sort} direction={direction} onSortChange={onSortChange} />
                            <SortableHead label="Old year" sortKey="source_year_level" activeSort={sort} direction={direction} onSortChange={onSortChange} />
                            <SortableHead label="Old section" sortKey="source_section" activeSort={sort} direction={direction} onSortChange={onSortChange} />
                            <SortableHead label="New year" sortKey="target_year_level" activeSort={sort} direction={direction} onSortChange={onSortChange} />
                            <SortableHead label="New section" sortKey="target_section" activeSort={sort} direction={direction} onSortChange={onSortChange} />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.data.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={allMatchingSelected || selectedIds.includes(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                        className="size-4 rounded border-[#040DBF]/20"
                                    />
                                </TableCell>
                                <TableCell>
                                    <p className="font-medium text-[#010440]">{student.name}</p>
                                    <p className="text-xs text-[#020659]/70">{student.rfid_uid}</p>
                                </TableCell>
                                <TableCell className="font-medium">{student.school_id}</TableCell>
                                <TableCell className="text-[#020659]/70">{student.source_student?.year_level ?? '-'}</TableCell>
                                <TableCell className="text-[#020659]/70">{student.source_student?.section ?? '-'}</TableCell>
                                <TableCell className="text-[#020659]/70">{student.target_student?.year_level ?? '-'}</TableCell>
                                <TableCell className="text-[#020659]/70">{student.target_student?.section ?? '-'}</TableCell>
                            </TableRow>
                        ))}
                        {students.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="px-5 py-14 text-center text-sm text-[#020659]/70">
                                    {emptyMessage}
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
                rowsPerPage={perPage}
                rowsPerPageOptions={[10, 30, 50, 100]}
                onPrevious={() => visitPage(students.prev_page_url ?? students.links.find((link) => link.label.includes('Previous'))?.url)}
                onNext={() => visitPage(students.next_page_url ?? students.links.find((link) => link.label.includes('Next'))?.url)}
                onRowsPerPageChange={onPerPageChange}
            />
        </section>
    );
}

function SortableHead({
    label,
    sortKey,
    activeSort,
    direction,
    onSortChange,
}: {
    label: string;
    sortKey: SortKey;
    activeSort: string;
    direction: 'asc' | 'desc';
    onSortChange: (sort: SortKey) => void;
}) {
    const isActive = activeSort === sortKey;
    const Icon = isActive ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <TableHead>
            <button
                type="button"
                onClick={() => onSortChange(sortKey)}
                className="inline-flex h-8 items-center gap-1 rounded-md px-1.5 font-semibold text-[#010440] hover:bg-[#040DBF]/10"
            >
                {label}
                <Icon className={`size-3.5 ${isActive ? 'text-[#040DBF]' : 'text-[#030A8C]/45'}`} />
            </button>
        </TableHead>
    );
}
