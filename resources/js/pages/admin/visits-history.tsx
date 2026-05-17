import {
    defaultRowsPerPage,
    formatVisitDateTime,
    groupLabel,
    sortVisitors,
    visitsInDateRange,
    type SortColumn,
    type SortDirection,
    type VisitorTypeFilter,
} from '@/components/admin/visits-history/visit-history-helpers';
import { HistoryMetricCard, SortableHead, VisitTypeTab } from '@/components/admin/visits-history/visit-history-ui';
import { VisitorHistoryModal } from '@/components/admin/visits-history/visitor-history-modal';
import { Button } from '@/components/ui/button';
import { DateInput, formatDisplayDate } from '@/components/ui/date-input';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { SelectInput } from '@/components/ui/select-input';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { AdminVisitHistory, VisitHistoryVisitor } from '@/types/dashboard';
import { Head, router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { BriefcaseBusiness, GraduationCap, Search, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface VisitsHistoryProps {
    visitHistory: AdminVisitHistory;
}

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
    const [sortColumn, setSortColumn] = useState<SortColumn>('lastVisit');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedVisitor, setSelectedVisitor] = useState<VisitHistoryVisitor | null>(null);

    useEchoPublic('library-visits', '.LibraryVisitRecorded', () => {
        router.reload({ only: ['visitHistory'] });
    });

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

    const sortedVisitors = useMemo(() => sortVisitors(filteredVisitors, sortColumn, sortDirection), [filteredVisitors, sortColumn, sortDirection]);
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
                            <HistoryMetricCard
                                icon={UserRound}
                                label="Visitors"
                                value={visitHistory.metrics.visitors}
                                detail="Active school year roster"
                            />
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
                                    <DateInput
                                        value={startDate}
                                        onChange={setStartDate}
                                        min={schoolYearStart || undefined}
                                        max={schoolYearEnd || undefined}
                                    />
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
                                            <SortableHead
                                                column="schoolId"
                                                label="ID"
                                                sort={sortColumn}
                                                direction={sortDirection}
                                                onSortChange={changeSort}
                                            />
                                            <SortableHead
                                                column="name"
                                                label="Name"
                                                sort={sortColumn}
                                                direction={sortDirection}
                                                onSortChange={changeSort}
                                            />
                                            <SortableHead
                                                column="group"
                                                label="Year / section or department"
                                                sort={sortColumn}
                                                direction={sortDirection}
                                                onSortChange={changeSort}
                                            />
                                            <SortableHead
                                                column="visitCount"
                                                label="Visits"
                                                sort={sortColumn}
                                                direction={sortDirection}
                                                onSortChange={changeSort}
                                            />
                                            <SortableHead
                                                column="lastVisit"
                                                label="Last visit"
                                                sort={sortColumn}
                                                direction={sortDirection}
                                                onSortChange={changeSort}
                                            />
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
                                                    <TableCell className="text-[#020659]/70">
                                                        {formatVisitDateTime(visitor.rangeVisits[0]?.visitedAt)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="px-5 py-14 text-center">
                                                    <p className="font-medium text-[#010440]">No visitors match the selected filters</p>
                                                    <p className="mt-2 text-sm text-[#020659]/70">
                                                        Try a wider date range or clear one of the visitor filters.
                                                    </p>
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
