import { Button } from '@/components/ui/button';
import { DateInput, formatDisplayDate } from '@/components/ui/date-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { SelectInput } from '@/components/ui/select-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitHistory, VisitHistoryVisit, VisitHistoryVisitor } from '@/types/dashboard';
import { Head } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    BriefcaseBusiness,
    CalendarClock,
    ChevronsUpDown,
    GraduationCap,
    History,
    Search,
    UserRound,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface VisitsHistoryProps {
    visitHistory: AdminVisitHistory;
}

type VisitorTypeFilter = 'student' | 'employee';
type SortColumn = 'schoolId' | 'name' | 'group' | 'visitCount' | 'lastVisit';
type SortDirection = 'asc' | 'desc';

const defaultRowsPerPage = 10;
const yearLevelOrder = [
    'Kindergarten 1',
    'Kindergarten 2',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
];

export default function VisitsHistory({ visitHistory }: VisitsHistoryProps) {
    const schoolYearStart = visitHistory.schoolYear?.starts_at ?? '';
    const schoolYearEnd = visitHistory.schoolYear?.ends_at ?? '';
    const [startDate, setStartDate] = useState(schoolYearStart);
    const [endDate, setEndDate] = useState(schoolYearEnd);
    const [visitorType, setVisitorType] = useState<VisitorTypeFilter>('student');
    const [yearLevel, setYearLevel] = useState('');
    const [section, setSection] = useState('');
    const [department, setDepartment] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageOption>(defaultRowsPerPage);
    const [sortColumn, setSortColumn] = useState<SortColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [selectedVisitor, setSelectedVisitor] = useState<VisitHistoryVisitor | null>(null);

    useEffect(() => {
        setStartDate(schoolYearStart);
        setEndDate(schoolYearEnd);
    }, [schoolYearEnd, schoolYearStart]);

    const visitorsWithRangeVisits = useMemo(() => {
        return visitHistory.visitors.map((visitor) => ({
            ...visitor,
            rangeVisits: visitsInDateRange(visitor.visits, startDate, endDate),
        }));
    }, [endDate, startDate, visitHistory.visitors]);

    const filteredVisitors = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return visitorsWithRangeVisits.filter((visitor) => {
            const searchable = [visitor.schoolId, visitor.name, visitor.yearLevel, visitor.section, visitor.department]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return (
                visitor.type === visitorType &&
                (visitorType !== 'student' || !yearLevel || visitor.yearLevel === yearLevel) &&
                (visitorType !== 'student' || !section || visitor.section === section) &&
                (visitorType !== 'employee' || !department || visitor.department === department) &&
                (!normalizedSearch || searchable.includes(normalizedSearch))
            );
        });
    }, [department, search, section, visitorType, visitorsWithRangeVisits, yearLevel]);

    const sortedVisitors = useMemo(
        () => sortVisitors(filteredVisitors, sortColumn, sortDirection),
        [filteredVisitors, sortColumn, sortDirection],
    );
    const totalPages = rowsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(sortedVisitors.length / rowsPerPage));
    const visibleVisitors = rowsPerPage === 'all' ? sortedVisitors : sortedVisitors.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const selectedVisitorVisits = selectedVisitor ? visitsInDateRange(selectedVisitor.visits, startDate, endDate) : [];
    const rangeMetrics = useMemo(() => {
        const studentVisits = visitorsWithRangeVisits
            .filter((visitor) => visitor.type === 'student')
            .reduce((sum, visitor) => sum + visitor.rangeVisits.length, 0);
        const employeeVisits = visitorsWithRangeVisits
            .filter((visitor) => visitor.type === 'employee')
            .reduce((sum, visitor) => sum + visitor.rangeVisits.length, 0);

        return {
            visits: studentVisits + employeeVisits,
            studentVisits,
            employeeVisits,
        };
    }, [visitorsWithRangeVisits]);

    useEffect(() => {
        setCurrentPage(1);
    }, [department, endDate, rowsPerPage, search, section, startDate, visitorType, yearLevel]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const changeVisitorType = (value: VisitorTypeFilter) => {
        setVisitorType(value);
        setYearLevel('');
        setSection('');
        setDepartment('');
    };

    const changeYearLevel = (value: string) => {
        setYearLevel(value);
        setSection('');
    };

    const resetDateCoverage = () => {
        setStartDate(schoolYearStart);
        setEndDate(schoolYearEnd);
    };

    const changeSort = (column: SortColumn) => {
        setSortColumn((currentColumn) => {
            if (currentColumn === column) {
                setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));

                return currentColumn;
            }

            setSortDirection(column === 'visitCount' || column === 'lastVisit' ? 'desc' : 'asc');

            return column;
        });
    };

    return (
        <>
            <Head title="Visits History" />
            <main className="min-h-screen">
                <AdminLayout active="visits-history">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Visits History"
                            description="Find a visitor in the active school year, then open their complete visit log for the selected dates."
                        />

                        <section className="grid gap-4 md:grid-cols-3">
                            <HistoryMetricCard icon={UserRound} label="Visitors" value={visitHistory.metrics.visitors} detail="Active school year roster" />
                            <HistoryMetricCard
                                icon={GraduationCap}
                                label="Student visits"
                                value={rangeMetrics.studentVisits}
                                detail="Selected date coverage"
                            />
                            <HistoryMetricCard
                                icon={BriefcaseBusiness}
                                label="Employee visits"
                                value={rangeMetrics.employeeVisits}
                                detail="Selected date coverage"
                            />
                        </section>

                        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
                                <div>
                                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">
                                        {visitHistory.schoolYear?.name ?? 'No active school year'}
                                    </h2>
                                    <p className="mt-1 text-sm text-[#020659]/70">
                                        {schoolYearStart && schoolYearEnd
                                            ? `${formatDisplayDate(schoolYearStart)} to ${formatDisplayDate(schoolYearEnd)}`
                                            : 'Activate a school year to view visit history.'}
                                    </p>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                    <DateInput value={startDate} onChange={setStartDate} min={schoolYearStart || undefined} max={schoolYearEnd || undefined} />
                                    <DateInput
                                        value={endDate}
                                        onChange={setEndDate}
                                        min={startDate || schoolYearStart || undefined}
                                        max={schoolYearEnd || undefined}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={resetDateCoverage} className="h-10 justify-center">
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
                            <div className="space-y-4 border-b border-[#040DBF]/10 px-5 py-4">
                                <div className="admin-segmented-tabs w-full sm:w-fit">
                                    <VisitTypeTab
                                        value="student"
                                        activeValue={visitorType}
                                        label="Students"
                                        count={visitHistory.metrics.studentVisitors}
                                        icon={GraduationCap}
                                        onChange={changeVisitorType}
                                    />
                                    <VisitTypeTab
                                        value="employee"
                                        activeValue={visitorType}
                                        label="Employees"
                                        count={visitHistory.metrics.employeeVisitors}
                                        icon={BriefcaseBusiness}
                                        onChange={changeVisitorType}
                                    />
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    {visitorType === 'student' && (
                                        <>
                                            <SelectInput value={yearLevel} onChange={(event) => changeYearLevel(event.target.value)}>
                                                <option value="">All year levels</option>
                                                {visitHistory.filters.yearLevels.map((level) => (
                                                    <option key={level} value={level}>
                                                        {level}
                                                    </option>
                                                ))}
                                            </SelectInput>
                                            <SelectInput value={section} onChange={(event) => setSection(event.target.value)} disabled={!yearLevel}>
                                                <option value="">{yearLevel ? 'All sections' : 'Choose year level first'}</option>
                                                {(visitHistory.filters.sectionsByYearLevel[yearLevel] ?? []).map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </SelectInput>
                                        </>
                                    )}

                                    {visitorType === 'employee' && (
                                        <SelectInput value={department} onChange={(event) => setDepartment(event.target.value)}>
                                            <option value="">All departments</option>
                                            {visitHistory.filters.departments.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </SelectInput>
                                    )}

                                    <div className="relative md:col-span-2 xl:col-span-1">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder="Search ID, name, section, department"
                                            className="h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-9 pl-9 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={() => setSearch('')}
                                                className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#030A8C]/50 transition hover:bg-[#040DBF]/5 hover:text-[#010440]"
                                                title="Clear search"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table className="min-w-[820px]">
                                    <TableHeader className="bg-[#f6f8ff]">
                                        <TableRow>
                                            <SortableHead column="schoolId" label="ID" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                                            <SortableHead column="name" label="Name" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                                            <SortableHead column="group" label="Year / section or department" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                                            <SortableHead column="visitCount" label="Visits" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                                            <SortableHead column="lastVisit" label="Last visit" sort={sortColumn} direction={sortDirection} onSortChange={changeSort} />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleVisitors.length > 0 ? (
                                            visibleVisitors.map((visitor) => (
                                                <TableRow
                                                    key={visitor.id}
                                                    tabIndex={0}
                                                    onClick={() => setSelectedVisitor(visitor)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            setSelectedVisitor(visitor);
                                                        }
                                                    }}
                                                    className="cursor-pointer focus-visible:bg-[#f6f8ff] focus-visible:outline-none"
                                                >
                                                    <TableCell className="font-medium text-[#010440]">{visitor.schoolId ?? '-'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <VisitorAvatar
                                                                name={visitor.name}
                                                                src={visitor.photoUrl}
                                                                className="live-visit-avatar bg-[#eef2ff] text-[#030A8C]/70 ring-1 ring-[#040DBF]/10"
                                                            />
                                                            <span className="truncate font-medium text-[#010440]">{visitor.name ?? '-'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-[#020659]/70">{groupLabel(visitor)}</TableCell>
                                                    <TableCell className="font-semibold text-[#010440]">{visitor.rangeVisits.length}</TableCell>
                                                    <TableCell className="text-[#020659]/70">{formatVisitDateTime(visitor.rangeVisits[0]?.visitedAt)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="px-5 py-14 text-center">
                                                    <p className="font-medium text-[#010440]">No visitors match the selected filters</p>
                                                    <p className="mt-2 text-sm text-[#020659]/70">Try a wider date range or clear one of the visitor filters.</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                from={sortedVisitors.length === 0 ? 0 : rowsPerPage === 'all' ? 1 : (currentPage - 1) * rowsPerPage + 1}
                                to={rowsPerPage === 'all' ? sortedVisitors.length : Math.min(currentPage * rowsPerPage, sortedVisitors.length)}
                                total={sortedVisitors.length}
                                rowsPerPage={rowsPerPage}
                                rowsPerPageOptions={[10, 30, 50, 100, 'all']}
                                onRowsPerPageChange={setRowsPerPage}
                                onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                onPageChange={(page) => setCurrentPage(Math.min(totalPages, Math.max(1, page)))}
                            />
                        </section>
                    </div>

                    <VisitorHistoryModal
                        visitor={selectedVisitor}
                        visits={selectedVisitorVisits}
                        startDate={startDate}
                        endDate={endDate}
                        open={Boolean(selectedVisitor)}
                        onOpenChange={(open) => {
                            if (!open) {
                                setSelectedVisitor(null);
                            }
                        }}
                    />
                </AdminLayout>
            </main>
        </>
    );
}

function VisitTypeTab({
    value,
    activeValue,
    label,
    count,
    icon: Icon,
    onChange,
}: {
    value: VisitorTypeFilter;
    activeValue: VisitorTypeFilter;
    label: string;
    count: number;
    icon: LucideIcon;
    onChange: (value: VisitorTypeFilter) => void;
}) {
    const isActive = value === activeValue;

    return (
        <button type="button" onClick={() => onChange(value)} className={`admin-segmented-tab ${isActive ? 'admin-segmented-tab-active' : ''}`}>
            <Icon className="size-3.5" />
            {label}
            <span className={isActive ? 'text-white/75' : 'text-[#030A8C]/60'}>{count}</span>
        </button>
    );
}

function HistoryMetricCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: number; detail: string }) {
    return (
        <div className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-[#030A8C]">{label}</p>
                    <p className="mt-3 text-4xl font-semibold tracking-normal text-[#010440]">{value.toLocaleString()}</p>
                </div>
                <span className="admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                    <Icon className="size-5" />
                </span>
            </div>
            <p className="mt-3 text-sm text-[#020659]/70">{detail}</p>
        </div>
    );
}

function VisitorHistoryModal({
    visitor,
    visits,
    startDate,
    endDate,
    open,
    onOpenChange,
}: {
    visitor: VisitHistoryVisitor | null;
    visits: VisitHistoryVisit[];
    startDate: string;
    endDate: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 pr-8">
                        <VisitorAvatar
                            name={visitor?.name ?? 'Visitor'}
                            src={visitor?.photoUrl}
                            className="live-visit-avatar bg-[#eef2ff] text-[#030A8C]/70 ring-1 ring-[#040DBF]/10"
                        />
                        <div className="min-w-0">
                            <DialogTitle className="truncate text-2xl text-[#010440]">{visitor?.name ?? 'Visitor details'}</DialogTitle>
                            <DialogDescription>
                                {visitor?.schoolId ?? 'No school ID'}{visitor ? ` - ${groupLabel(visitor)}` : ''}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-3">
                    <ModalStat icon={History} label="Total visits" value={visits.length.toLocaleString()} />
                    <ModalStat icon={CalendarClock} label="First visit" value={formatVisitDateTime(visits.at(-1)?.visitedAt)} />
                    <ModalStat icon={CalendarClock} label="Last visit" value={formatVisitDateTime(visits[0]?.visitedAt)} />
                </div>

                <section className="overflow-hidden rounded-lg border border-[#040DBF]/10">
                    <div className="border-b border-[#040DBF]/10 bg-[#f6f8ff] px-4 py-3">
                        <h3 className="font-semibold text-[#010440]">Visit log</h3>
                        <p className="mt-1 text-sm text-[#020659]/70">{summarizeDateRange(startDate, endDate)}</p>
                    </div>

                    {visits.length > 0 ? (
                        <div className="max-h-[24rem] overflow-y-auto overscroll-contain">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-white">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visits.map((visit) => {
                                        const visitedAt = parseVisitDate(visit.visitedAt);

                                        return (
                                            <TableRow key={visit.id}>
                                                <TableCell className="font-medium text-[#010440]">
                                                    {visitedAt ? formatDisplayDate(toLocalIsoDate(visitedAt)) : '-'}
                                                </TableCell>
                                                <TableCell className="text-[#020659]/70">
                                                    {visitedAt
                                                        ? visitedAt.toLocaleTimeString([], {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="px-4 py-10 text-center text-sm text-[#020659]/70">No visits recorded in the selected date coverage.</div>
                    )}
                </section>
            </DialogContent>
        </Dialog>
    );
}

function ModalStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <span className="admin-icon-badge inline-flex size-9 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                <Icon className="size-4" />
            </span>
            <p className="mt-3 text-xs font-semibold tracking-[0.12em] text-[#030A8C] uppercase">{label}</p>
            <p className="mt-1 text-base font-semibold text-[#010440]">{value}</p>
        </div>
    );
}

function SortableHead({
    column,
    label,
    sort,
    direction,
    onSortChange,
}: {
    column: SortColumn;
    label: string;
    sort: SortColumn;
    direction: SortDirection;
    onSortChange: (column: SortColumn) => void;
}) {
    const active = sort === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <TableHead>
            <button type="button" onClick={() => onSortChange(column)} className="inline-flex items-center gap-1.5 hover:text-[#010440]">
                {label}
                <Icon className="size-3.5" />
            </button>
        </TableHead>
    );
}

type VisitorWithRangeVisits = VisitHistoryVisitor & { rangeVisits: VisitHistoryVisit[] };

function sortVisitors(visitors: VisitorWithRangeVisits[], column: SortColumn, direction: SortDirection) {
    return [...visitors].sort((first, second) => {
        const comparison = compareValues(sortValue(first, column), sortValue(second, column));

        return direction === 'asc' ? comparison : comparison * -1;
    });
}

function sortValue(visitor: VisitorWithRangeVisits, column: SortColumn) {
    if (column === 'schoolId') {
        return visitor.schoolId ?? '';
    }

    if (column === 'name') {
        return visitor.name ?? '';
    }

    if (column === 'visitCount') {
        return visitor.rangeVisits.length;
    }

    if (column === 'lastVisit') {
        return parseVisitDate(visitor.rangeVisits[0]?.visitedAt)?.getTime() ?? 0;
    }

    if (visitor.type === 'student') {
        const yearLevelRank = yearLevelOrder.indexOf(visitor.yearLevel ?? '');

        return `${String(yearLevelRank >= 0 ? yearLevelRank : 99).padStart(2, '0')} ${visitor.section ?? ''}`;
    }

    return visitor.department ?? '';
}

function compareValues(first: string | number, second: string | number) {
    if (typeof first === 'number' && typeof second === 'number') {
        return first - second;
    }

    return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' });
}

function visitsInDateRange(visits: VisitHistoryVisit[], startDate: string, endDate: string) {
    return visits.filter((visit) => {
        const visitedAt = parseVisitDate(visit.visitedAt);

        if (!visitedAt) {
            return false;
        }

        const visitDate = toLocalIsoDate(visitedAt);

        return (!startDate || visitDate >= startDate) && (!endDate || visitDate <= endDate);
    });
}

function groupLabel(visitor: VisitHistoryVisitor) {
    if (visitor.type === 'employee') {
        return visitor.department || 'No department';
    }

    return [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'No year level or section';
}

function summarizeDateRange(startDate: string, endDate: string) {
    if (startDate && endDate) {
        return `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`;
    }

    if (startDate) {
        return `From ${formatDisplayDate(startDate)}`;
    }

    if (endDate) {
        return `Until ${formatDisplayDate(endDate)}`;
    }

    return 'All active school-year dates';
}

function formatVisitDateTime(value?: string | null) {
    const date = parseVisitDate(value);

    if (!date) {
        return '-';
    }

    return `${formatDisplayDate(toLocalIsoDate(date))}, ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
}

function parseVisitDate(value?: string | null) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
