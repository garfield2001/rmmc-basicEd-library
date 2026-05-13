import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VirtualTableSpacerRow } from '@/components/ui/virtual-table-spacer-row';
import { useViewportHeight, useWindowVirtualRows } from '@/hooks/use-window-virtual-rows';
import { csrfFetch } from '@/lib/http';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types/pagination';
import type { RegisteredVisitorRow } from '@/types/registered-visitors';
import { router } from '@inertiajs/react';
import { AlertTriangle, ArrowDown, ArrowUp, Check, ChevronsUpDown, ClipboardCopy, Columns3, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type MemberType = 'student' | 'employee';
type SortDirection = 'asc' | 'desc';
type ColumnKey = 'member' | 'school_id' | 'year_level' | 'section' | 'department' | 'status';
const VIRTUAL_ROW_HEIGHT = 73;
const VIRTUAL_OVERSCAN = 8;

interface ColumnOption {
    key: ColumnKey;
    label: string;
}

interface MembersTableProps {
    members: Paginated<RegisteredVisitorRow>;
    activeType: MemberType;
    rowsPerPage: RowsPerPageOption;
    sort: string;
    direction: SortDirection;
    isLoading?: boolean;
    copyFilters: {
        search: string;
        type: MemberType;
        year_level: string;
        section: string;
        department: string;
        sort: string;
        direction: SortDirection;
    };
    onRowsPerPageChange: (rows: RowsPerPageOption) => void;
    onSortChange: (column: string) => void;
    onSortClear: () => void;
    onEdit: (member: RegisteredVisitorRow) => void;
    onDelete: (member: RegisteredVisitorRow) => void;
    onPrevious: () => void;
    onNext: () => void;
}

export function MembersTable({
    members,
    activeType,
    rowsPerPage,
    sort,
    direction,
    isLoading = false,
    copyFilters,
    onRowsPerPageChange,
    onSortChange,
    onSortClear,
    onEdit,
    onDelete,
    onPrevious,
    onNext,
}: MembersTableProps) {
    const currentPage = members.meta?.current_page ?? members.current_page ?? 1;
    const totalPages = members.meta?.last_page ?? members.last_page ?? 1;
    const from = members.meta?.from ?? members.from ?? 0;
    const to = members.meta?.to ?? members.to ?? 0;
    const total = members.meta?.total ?? members.total ?? members.data.length;
    const columns = useMemo<ColumnOption[]>(() => {
        const sharedColumns: ColumnOption[] = [
            { key: 'member', label: activeType === 'student' ? 'Student' : 'Employee' },
            { key: 'school_id', label: 'School ID' },
        ];

        return activeType === 'student'
            ? [...sharedColumns, { key: 'year_level', label: 'Year level' }, { key: 'section', label: 'Section' }, { key: 'status', label: 'Status' }]
            : [...sharedColumns, { key: 'department', label: 'Department' }, { key: 'status', label: 'Status' }];
    }, [activeType]);
    const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
    const [copyColumns, setCopyColumns] = useState<ColumnKey[]>(['school_id']);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [copyMenuOpen, setCopyMenuOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [selectedAllMatching, setSelectedAllMatching] = useState(false);
    const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);
    const [bulkArchiving, setBulkArchiving] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement | null>(null);
    const copyMenuRef = useRef<HTMLDivElement | null>(null);
    const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);
    const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
    const visibleColumnCount = visibleColumns.length + 2;
    const allColumnsVisible = hiddenColumns.length === 0;
    const viewportHeight = useViewportHeight();
    const onePageRowCapacity = Math.max(1, Math.floor(viewportHeight / VIRTUAL_ROW_HEIGHT));
    const usesVirtualRows = !isLoading && rowsPerPage === 'all' && members.data.length > onePageRowCapacity;
    const virtualRows = useWindowVirtualRows({
        enabled: usesVirtualRows,
        itemCount: members.data.length,
        rowHeight: VIRTUAL_ROW_HEIGHT,
        overscan: VIRTUAL_OVERSCAN,
        containerRef: tableBodyRef,
    });
    const displayedMembers = usesVirtualRows ? members.data.slice(virtualRows.startIndex, virtualRows.endIndex) : members.data;
    const pageMemberIds = members.data.map((member) => member.id);
    const selectedPageIds = pageMemberIds.filter((id) => selectedAllMatching || selectedMemberIds.includes(id));
    const allPageMembersSelected = pageMemberIds.length > 0 && selectedPageIds.length === pageMemberIds.length;
    const selectedCount = selectedAllMatching ? total : selectedMemberIds.length;
    const canSelectAllMatching = !selectedAllMatching && allPageMembersSelected && total > pageMemberIds.length;

    useEffect(() => {
        setHiddenColumns((current) => current.filter((column) => columns.some((option) => option.key === column)));
    }, [columns]);

    useEffect(() => {
        setCopyColumns((current) => {
            const availableColumns = current.filter((column) => columns.some((option) => option.key === column));

            return availableColumns.length > 0 ? availableColumns : ['school_id'];
        });
    }, [columns]);

    useEffect(() => {
        const memberIds = new Set(members.data.map((member) => member.id));

        setSelectedMemberIds((current) => {
            if (selectedAllMatching) {
                return Array.from(memberIds);
            }

            return current.filter((id) => memberIds.has(id));
        });
    }, [members.data, selectedAllMatching]);

    useEffect(() => {
        setSelectedAllMatching(false);
        setSelectedMemberIds([]);
    }, [activeType, copyFilters.search, copyFilters.year_level, copyFilters.section, copyFilters.department]);

    useEffect(() => {
        if (!columnMenuOpen && !copyMenuOpen) {
            return;
        }

        const closeMenu = (event: PointerEvent) => {
            const target = event.target as Node;

            if (!columnMenuRef.current?.contains(target)) {
                setColumnMenuOpen(false);
            }

            if (!copyMenuRef.current?.contains(target)) {
                setCopyMenuOpen(false);
            }
        };

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setColumnMenuOpen(false);
                setCopyMenuOpen(false);
            }
        };

        document.addEventListener('pointerdown', closeMenu);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('pointerdown', closeMenu);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [columnMenuOpen, copyMenuOpen]);

    const isVisible = (column: ColumnKey) => !hiddenColumns.includes(column);

    const toggleColumn = (column: ColumnKey) => {
        setHiddenColumns((current) => {
            if (current.includes(column)) {
                return current.filter((item) => item !== column);
            }

            return [...current, column];
        });
    };

    const toggleCopyColumn = (column: ColumnKey) => {
        setCopyColumns((current) => {
            if (current.includes(column)) {
                return current.filter((item) => item !== column);
            }

            return [...current, column];
        });
    };

    const togglePageSelection = () => {
        if (selectedAllMatching) {
            setSelectedAllMatching(false);
            setSelectedMemberIds([]);

            return;
        }

        if (allPageMembersSelected) {
            setSelectedMemberIds((current) => current.filter((id) => !pageMemberIds.includes(id)));

            return;
        }

        setSelectedMemberIds((current) => Array.from(new Set([...current, ...pageMemberIds])));
    };

    const toggleMemberSelection = (memberId: number) => {
        if (selectedAllMatching) {
            setSelectedAllMatching(false);
            setSelectedMemberIds(pageMemberIds.filter((id) => id !== memberId));

            return;
        }

        setSelectedMemberIds((current) => {
            if (current.includes(memberId)) {
                return current.filter((id) => id !== memberId);
            }

            return [...current, memberId];
        });
    };

    const archiveSelectedMembers = () => {
        setBulkArchiveOpen(false);
        setBulkArchiving(true);
        router.delete('/admin/registered-visitors/bulk', {
            data: {
                select_all: selectedAllMatching,
                ...(!selectedAllMatching ? { member_ids: selectedMemberIds } : {}),
                type: activeType,
                search: copyFilters.search || undefined,
                year_level: activeType === 'student' ? copyFilters.year_level || undefined : undefined,
                section: activeType === 'student' && copyFilters.year_level ? copyFilters.section || undefined : undefined,
                department: activeType === 'employee' ? copyFilters.department || undefined : undefined,
            },
            preserveScroll: true,
            onFinish: () => setBulkArchiving(false),
            onSuccess: () => {
                setSelectedMemberIds([]);
                setSelectedAllMatching(false);
            },
        });
    };

    const copySelectedColumns = async () => {
        if (copyColumns.length === 0) {
            setCopyStatus('Choose at least one column.');

            return;
        }

        setIsCopying(true);
        setCopyStatus(null);

        try {
            const response = await csrfFetch('/admin/registered-visitors/copy-columns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...copyFilters,
                    columns: copyColumns,
                }),
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                setCopyStatus(payload?.message ?? 'Unable to copy these columns.');
                return;
            }

            await writeClipboard(payload.text ?? '');
            setCopyStatus(`Copied ${Number(payload.rowCount ?? 0).toLocaleString()} rows.`);
        } catch {
            setCopyStatus('Unable to copy these columns right now.');
        } finally {
            setIsCopying(false);
        }
    };

    return (
        <div className="relative rounded-xl border border-zinc-200 bg-white shadow-sm" aria-busy={isLoading}>
            <div className="flex flex-col gap-2 border-b border-zinc-200 bg-zinc-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-9">
                    {selectedCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#020659] shadow-sm">
                                {selectedCount.toLocaleString()} selected
                            </span>
                            {canSelectAllMatching && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedAllMatching(true);
                                        setSelectedMemberIds(pageMemberIds);
                                    }}
                                    className="h-9 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm"
                                >
                                    Select all {total.toLocaleString()} matching
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setBulkArchiveOpen(true)}
                                className="admin-danger-action inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition-[background-color,border-color,color,box-shadow] hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-sm"
                            >
                                <Trash2 className="size-4" />
                                Archive selected
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedMemberIds([]);
                                    setSelectedAllMatching(false);
                                }}
                                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 transition-[background-color,border-color,color] hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {sort !== 'created_at' && (
                        <button
                            type="button"
                            onClick={onSortClear}
                            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm sm:w-auto"
                        >
                            <RotateCcw className="size-4" />
                            Clear sort
                        </button>
                    )}
                    <div ref={copyMenuRef} className="relative w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setCopyMenuOpen((open) => !open)}
                            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm sm:w-auto"
                        >
                            <ClipboardCopy className="size-4" />
                            Copy
                        </button>
                        {copyMenuOpen && (
                            <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
                                <div className="flex gap-2 border-b border-zinc-100 pb-2">
                                    <button
                                        type="button"
                                        onClick={() => setCopyColumns(columns.map((column) => column.key))}
                                        className="flex-1 rounded-md border border-[#040DBF]/15 px-3 py-2 text-xs font-semibold text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm"
                                    >
                                        Select all
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCopyColumns([])}
                                        className="flex-1 rounded-md border border-[#040DBF]/15 px-3 py-2 text-xs font-semibold text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="py-1">
                                    {columns.map((column) => (
                                        <label
                                            key={column.key}
                                            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={copyColumns.includes(column.key)}
                                                onChange={() => toggleCopyColumn(column.key)}
                                                className="size-4 rounded border-zinc-300"
                                            />
                                            {column.label}
                                        </label>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={copySelectedColumns}
                                    disabled={isCopying || copyColumns.length === 0}
                                    className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-45"
                                >
                                    {isCopying ? 'Copying...' : 'Copy selected columns'}
                                    {!isCopying && <Check className="size-4" />}
                                </button>
                                {copyStatus && <p className="mt-2 text-xs font-medium text-zinc-500">{copyStatus}</p>}
                            </div>
                        )}
                    </div>
                    <div ref={columnMenuRef} className="relative w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setColumnMenuOpen((open) => !open)}
                            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm sm:w-auto"
                        >
                            <Columns3 className="size-4" />
                            Columns
                        </button>
                        {columnMenuOpen && (
                            <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
                                <button
                                    type="button"
                                    onClick={() => setHiddenColumns([])}
                                    disabled={allColumnsVisible}
                                    className="mb-1 flex w-full items-center justify-center rounded-md border border-[#040DBF]/15 px-3 py-2 text-sm font-semibold text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm disabled:opacity-45 disabled:hover:border-[#040DBF]/15 disabled:hover:bg-transparent disabled:hover:text-[#020659] disabled:hover:shadow-none"
                                >
                                    Select all columns
                                </button>
                                {columns.map((column) => {
                                    const checked = isVisible(column.key);
                                    const isLastVisible = checked && visibleColumns.length === 1;

                                    return (
                                        <label
                                            key={column.key}
                                            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={isLastVisible}
                                                onChange={() => toggleColumn(column.key)}
                                                className="size-4 rounded border-zinc-300"
                                            />
                                            {column.label}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <Table className={activeType === 'student' ? 'min-w-190' : 'min-w-170'}>
                    <TableHeader className="bg-zinc-50">
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    checked={allPageMembersSelected}
                                    disabled={isLoading || pageMemberIds.length === 0}
                                    onChange={togglePageSelection}
                                    className="size-4 rounded border-zinc-300"
                                    aria-label="Select current page members"
                                />
                            </TableHead>
                            {isVisible('member') && (
                                <SortableHead
                                    column="name"
                                    label={activeType === 'student' ? 'Student' : 'Employee'}
                                    sort={sort}
                                    direction={direction}
                                    onSortChange={onSortChange}
                                />
                            )}
                            {isVisible('school_id') && (
                                <SortableHead column="school_id" label="School ID" sort={sort} direction={direction} onSortChange={onSortChange} />
                            )}
                            {activeType === 'student' ? (
                                <>
                                    {isVisible('year_level') && (
                                        <SortableHead
                                            column="year_level"
                                            label="Year level"
                                            sort={sort}
                                            direction={direction}
                                            onSortChange={onSortChange}
                                        />
                                    )}
                                    {isVisible('section') && (
                                        <SortableHead
                                            column="section"
                                            label="Section"
                                            sort={sort}
                                            direction={direction}
                                            onSortChange={onSortChange}
                                        />
                                    )}
                                </>
                            ) : (
                                isVisible('department') && (
                                    <SortableHead
                                        column="department"
                                        label="Department"
                                        sort={sort}
                                        direction={direction}
                                        onSortChange={onSortChange}
                                    />
                                )
                            )}
                            {isVisible('status') && (
                                <SortableHead column="status" label="Status" sort={sort} direction={direction} onSortChange={onSortChange} />
                            )}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody ref={tableBodyRef}>
                        {isLoading ? (
                            <LoadingRows
                                visibleColumns={visibleColumns}
                                activeType={activeType}
                                rowCount={rowsPerPage === 'all' ? 10 : Math.min(rowsPerPage, 10)}
                            />
                        ) : members.data.length > 0 ? (
                            <>
                                {usesVirtualRows && virtualRows.paddingTop > 0 && (
                                    <VirtualTableSpacerRow height={virtualRows.paddingTop} colSpan={visibleColumnCount} />
                                )}
                                {displayedMembers.map((member) => (
                                    <MemberDataRow
                                        key={member.id}
                                        member={member}
                                        activeType={activeType}
                                        isVisible={isVisible}
                                        selected={selectedAllMatching || selectedMemberIds.includes(member.id)}
                                        onSelect={() => toggleMemberSelection(member.id)}
                                        onEdit={() => onEdit(member)}
                                        onDelete={() => onDelete(member)}
                                    />
                                ))}
                                {usesVirtualRows && virtualRows.paddingBottom > 0 && (
                                    <VirtualTableSpacerRow height={virtualRows.paddingBottom} colSpan={visibleColumnCount} />
                                )}
                            </>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={visibleColumnCount} className="px-5 py-14 text-center text-sm text-zinc-500">
                                    No {activeType === 'student' ? 'students' : 'employees'} found.
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
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 30, 50, 100, 'all']}
                onRowsPerPageChange={onRowsPerPageChange}
                onPrevious={onPrevious}
                onNext={onNext}
            />
            <BulkArchiveMembersDialog
                count={selectedCount}
                open={bulkArchiveOpen}
                processing={bulkArchiving}
                onOpenChange={(open) => !open && !bulkArchiving && setBulkArchiveOpen(false)}
                onConfirm={archiveSelectedMembers}
            />
        </div>
    );
}

async function writeClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);

        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

function MemberDataRow({
    member,
    activeType,
    isVisible,
    selected,
    onSelect,
    onEdit,
    onDelete,
}: {
    member: RegisteredVisitorRow;
    activeType: MemberType;
    isVisible: (column: ColumnKey) => boolean;
    selected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <TableRow>
            <TableCell>
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onSelect}
                    className="size-4 rounded border-zinc-300"
                    aria-label={`Select ${member.name}`}
                />
            </TableCell>
            {isVisible('member') && (
                <TableCell>
                    <MemberIdentity member={member} />
                </TableCell>
            )}
            {isVisible('school_id') && <TableCell className="font-medium">{member.school_id}</TableCell>}
            {activeType === 'student' ? (
                <>
                    {isVisible('year_level') && <TableCell className="text-zinc-500">{member.student?.year_level || '-'}</TableCell>}
                    {isVisible('section') && <TableCell className="text-zinc-500">{member.student?.section || '-'}</TableCell>}
                </>
            ) : (
                isVisible('department') && <TableCell className="text-zinc-500">{member.employee?.department || '-'}</TableCell>
            )}
            {isVisible('status') && (
                <TableCell>
                    <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}
                    >
                        {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                </TableCell>
            )}
            <TableCell>
                <div className="flex justify-end gap-2">
                    <ActionButton label="Edit visitor" icon={Pencil} onClick={onEdit} />
                    <ActionButton label="Archive visitor" icon={Trash2} danger onClick={onDelete} />
                </div>
            </TableCell>
        </TableRow>
    );
}

function LoadingRows({ visibleColumns, activeType, rowCount }: { visibleColumns: ColumnOption[]; activeType: MemberType; rowCount: number }) {
    return (
        <>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                    <TableCell>
                        <SkeletonBlock className="size-4 rounded" />
                    </TableCell>
                    {visibleColumns.map((column) => (
                        <TableCell key={column.key}>
                            <LoadingCell column={column.key} activeType={activeType} />
                        </TableCell>
                    ))}
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

function LoadingCell({ column, activeType }: { column: ColumnKey; activeType: MemberType }) {
    if (column === 'member') {
        return (
            <div className="flex items-center gap-3">
                <SkeletonBlock className="size-10 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-3.5 w-36 max-w-full rounded-full" />
                    <SkeletonBlock className="h-3 w-24 max-w-full rounded-full" />
                </div>
            </div>
        );
    }

    if (column === 'status') {
        return <SkeletonBlock className="h-6 w-16 rounded-full" />;
    }

    if (column === 'year_level' || column === 'department') {
        return <SkeletonBlock className={`h-3.5 rounded-full ${activeType === 'employee' ? 'w-44' : 'w-24'}`} />;
    }

    return <SkeletonBlock className="h-3.5 w-28 rounded-full" />;
}

function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse bg-zinc-200/80 ${className}`} />;
}

function SortableHead({
    column,
    label,
    sort,
    direction,
    onSortChange,
}: {
    column: string;
    label: string;
    sort: string;
    direction: SortDirection;
    onSortChange: (column: string) => void;
}) {
    const active = sort === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <TableHead>
            <button type="button" onClick={() => onSortChange(column)} className="inline-flex items-center gap-1.5 hover:text-zinc-900">
                {label}
                <Icon className="size-3.5" />
            </button>
        </TableHead>
    );
}

function MemberIdentity({ member }: { member: RegisteredVisitorRow }) {
    return (
        <div className="flex items-center gap-3">
            <MemberAvatar name={member.name} src={member.photo_url} />
            <p className="min-w-0 font-medium">{member.name}</p>
        </div>
    );
}

function ActionButton({ label, icon: Icon, danger = false, onClick }: { label: string; icon: typeof Pencil; danger?: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100',
                danger && 'admin-danger-action border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700',
            )}
            title={label}
        >
            <Icon className="size-4" />
        </button>
    );
}

function BulkArchiveMembersDialog({
    count,
    open,
    processing,
    onOpenChange,
    onConfirm,
}: {
    count: number;
    open: boolean;
    processing: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <AlertTriangle className="size-5" />
                    </div>
                    <DialogTitle className="text-2xl text-[#010440]">Archive selected visitors?</DialogTitle>
                    <DialogDescription>
                        This will move {count} selected {count === 1 ? 'visitor' : 'visitors'} to Archive. Their visit history stays available, and
                        they can be restored later.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" variant="danger" onClick={onConfirm} disabled={processing || count === 0}>
                        {processing ? 'Archiving...' : 'Archive selected'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
