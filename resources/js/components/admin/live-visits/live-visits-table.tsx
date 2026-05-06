import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DashboardVisit } from '@/types/dashboard';
import { BarChart3, BriefcaseBusiness, ChevronLeft, ChevronRight, GraduationCap, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type VisitTab = 'student' | 'employee';

interface LiveVisitsTableProps {
    visits: DashboardVisit[];
    studentCount: number;
    employeeCount: number;
}

const visitsPerPage = 10;

function formatVisitTime(visit: DashboardVisit) {
    return visit.visitedAt
        ? new Date(visit.visitedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Pending';
}

export function LiveVisitsTable({ visits, studentCount, employeeCount }: LiveVisitsTableProps) {
    const [visitTab, setVisitTab] = useState<VisitTab>('student');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const visitTabs: { label: string; value: VisitTab; count: number; icon: typeof GraduationCap }[] = [
        { label: 'Students', value: 'student', count: studentCount, icon: GraduationCap },
        { label: 'Employees', value: 'employee', count: employeeCount, icon: BriefcaseBusiness },
    ];
    const filteredVisits = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return visits.filter((visit) => {
            const searchable = [
                visit.member.schoolId,
                visit.member.name,
                visit.member.type,
                visit.member.yearLevel,
                visit.member.section,
                visit.member.department,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return visit.member.type === visitTab && (!normalizedSearch || searchable.includes(normalizedSearch));
        });
    }, [search, visitTab, visits]);
    const totalPages = Math.max(1, Math.ceil(filteredVisits.length / visitsPerPage));
    const visibleVisits = filteredVisits.slice((currentPage - 1) * visitsPerPage, currentPage * visitsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, visitTab]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    return (
        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#040DBF]/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="size-5 text-[#030A8C]" />
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">
                            {visitTab === 'student' ? 'Student visits today' : 'Employee visits today'}
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-[#020659]/70">Latest RFID scans for the selected tab are shown first.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={visitTab === 'student' ? 'Search ID, name, section' : 'Search ID, name, department'}
                            className="h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 sm:w-72"
                        />
                    </div>
                    <div className="flex rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-1">
                        {visitTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = visitTab === tab.value;

                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => setVisitTab(tab.value)}
                                    className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition ${
                                        isActive ? 'bg-white text-[#010440] shadow-sm' : 'text-[#030A8C] hover:text-[#010440]'
                                    }`}
                                >
                                    <Icon className="size-3.5" />
                                    {tab.label}
                                    <span className="text-[#030A8C]/60">{tab.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table className={visitTab === 'student' ? 'min-w-[760px]' : 'min-w-[640px]'}>
                    <TableHeader className="bg-[#f6f8ff]">
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            {visitTab === 'student' ? (
                                <>
                                    <TableHead>Year level</TableHead>
                                    <TableHead>Section</TableHead>
                                </>
                            ) : (
                                <TableHead>Department</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleVisits.length > 0 ? (
                            visibleVisits.map((visit) => (
                                <TableRow key={visit.id}>
                                    <TableCell className="text-[#030A8C]">{formatVisitTime(visit)}</TableCell>
                                    <TableCell className="font-medium">{visit.member.schoolId}</TableCell>
                                    <TableCell>{visit.member.name}</TableCell>
                                    {visitTab === 'student' ? (
                                        <>
                                            <TableCell className="text-[#020659]/70">{visit.member.yearLevel || '-'}</TableCell>
                                            <TableCell className="text-[#020659]/70">{visit.member.section || '-'}</TableCell>
                                        </>
                                    ) : (
                                        <TableCell className="text-[#020659]/70">{visit.member.department || '-'}</TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={visitTab === 'student' ? 5 : 4} className="px-5 py-14 text-center">
                                    <p className="font-medium text-[#010440]">
                                        {visits.length > 0 ? 'No records match the selected filter' : 'No RFID visits recorded today'}
                                    </p>
                                    <p className="mt-2 text-sm text-[#020659]/70">
                                        {visits.length > 0
                                            ? 'Try another filter or search term.'
                                            : 'Scanned student and employee visits will appear here.'}
                                    </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#040DBF]/10 px-5 py-4 text-sm text-[#020659]/70 sm:flex-row sm:items-center sm:justify-between">
                <span>
                    Showing {visibleVisits.length === 0 ? 0 : (currentPage - 1) * visitsPerPage + 1}-
                    {Math.min(currentPage * visitsPerPage, filteredVisits.length)} of {filteredVisits.length}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#040DBF]/15 bg-white px-3 font-medium text-[#020659] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <ChevronLeft className="size-4" />
                        Previous
                    </button>
                    <span className="px-2 font-medium text-[#010440]">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#040DBF]/15 bg-white px-3 font-medium text-[#020659] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        Next
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}
