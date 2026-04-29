import { AdminPageHeader, AdminShell } from '@/components/admin-shell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type AdminDashboard, type DashboardVisit, type PublicDashboard } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { BarChart3, BriefcaseBusiness, Clock3, GraduationCap, Library, RadioTower, ScanLine, Search, ShieldCheck } from 'lucide-react';
import { type FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

interface AdminDashboardProps {
    dashboard: AdminDashboard;
    publicDashboard: PublicDashboard;
}

interface ScanForm {
    [key: string]: string;
    rfid_uid: string;
}

type VisitTab = 'student' | 'employee';

export default function Dashboard({ dashboard, publicDashboard }: AdminDashboardProps) {
    const [visitTab, setVisitTab] = useState<VisitTab>('student');
    const [search, setSearch] = useState('');
    const [manilaTime, setManilaTime] = useState(() => new Date());
    const scanInputRef = useRef<HTMLInputElement | null>(null);
    const lastVisit = publicDashboard.todayVisits[0];
    const {
        data: scanData,
        setData: setScanData,
        post: postScan,
        processing: scanning,
        reset: resetScan,
        errors: scanErrors,
    } = useForm<ScanForm>({
        rfid_uid: '',
    });

    const todayMetrics = [
        {
            label: 'Visits today',
            value: publicDashboard.metrics.visitsToday,
            detail: 'RFID scans since midnight',
            icon: Library,
        },
        {
            label: 'Students',
            value: publicDashboard.metrics.studentVisitsToday,
            detail: 'Student entries logged',
            icon: GraduationCap,
        },
        {
            label: 'Employees',
            value: publicDashboard.metrics.employeeVisitsToday,
            detail: 'Employee entries logged',
            icon: BriefcaseBusiness,
        },
    ];

    const visitTabs: { label: string; value: VisitTab; count: number; icon: typeof GraduationCap }[] = [
        { label: 'Students', value: 'student', count: publicDashboard.metrics.studentVisitsToday, icon: GraduationCap },
        { label: 'Employees', value: 'employee', count: publicDashboard.metrics.employeeVisitsToday, icon: BriefcaseBusiness },
    ];

    const filteredVisits = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return publicDashboard.todayVisits.filter((visit) => {
            const searchable = [
                visit.member.schoolId,
                visit.member.name,
                visit.member.group,
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
    }, [publicDashboard.todayVisits, search, visitTab]);

    const formatVisitTime = (visit: DashboardVisit) =>
        visit.visitedAt
            ? new Date(visit.visitedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : 'Pending';

    const formattedManilaTime = manilaTime.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

    const submitScan: FormEventHandler = (event) => {
        event.preventDefault();

        postScan('/library-visits', {
            preserveScroll: true,
            onSuccess: () => {
                resetScan('rfid_uid');
                scanInputRef.current?.focus();
            },
        });
    };

    useEffect(() => {
        scanInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => setManilaTime(new Date()), 1000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        let scanBuffer = '';
        let scanTimer: number | null = null;

        const resetBuffer = () => {
            scanBuffer = '';

            if (scanTimer) {
                window.clearTimeout(scanTimer);
                scanTimer = null;
            }
        };

        const listener = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTypingField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';

            if (isTypingField) {
                return;
            }

            if (event.key === 'Enter') {
                if (scanBuffer.length >= 6) {
                    router.post(
                        '/library-visits',
                        { rfid_uid: scanBuffer },
                        {
                            preserveScroll: true,
                            onFinish: () => scanInputRef.current?.focus(),
                        },
                    );
                }

                resetBuffer();
                return;
            }

            if (event.key.length === 1) {
                scanBuffer += event.key;

                if (scanTimer) {
                    window.clearTimeout(scanTimer);
                }

                scanTimer = window.setTimeout(resetBuffer, 120);
            }
        };

        window.addEventListener('keydown', listener);

        return () => {
            window.removeEventListener('keydown', listener);
            resetBuffer();
        };
    }, []);

    return (
        <>
            <Head title="Live Visits" />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminShell active="monitor">
                    <div className="space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Live Visits"
                            description="Detailed operations monitor for RFID attendance, today's visit flow, and student or employee entries."
                            badge={
                                dashboard.schoolYear ? (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                                        <ShieldCheck className="size-3.5" />
                                        {dashboard.schoolYear.name}
                                    </span>
                                ) : undefined
                            }
                            actions={
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <Clock3 className="size-4" />
                                    <span>{formattedManilaTime}</span>
                                </div>
                            }
                        />

                        <section className="grid gap-4">
                            <form onSubmit={submitScan} className="rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
                                        <RadioTower className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">RFID scanner</p>
                                        <h2 className="text-xl font-semibold">Record a library visit</h2>
                                    </div>
                                </div>
                                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                    <input
                                        ref={scanInputRef}
                                        value={scanData.rfid_uid}
                                        onChange={(event) => setScanData('rfid_uid', event.target.value)}
                                        placeholder="Scan or enter RFID"
                                        className="h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                        autoComplete="off"
                                        autoFocus
                                    />
                                    <Button type="submit" disabled={scanning}>
                                        <ScanLine className="size-4" />
                                        {scanning ? 'Recording...' : 'Record visit'}
                                    </Button>
                                </div>
                                {scanErrors.rfid_uid && <p className="mt-2 text-sm text-red-600">{scanErrors.rfid_uid}</p>}
                            </form>
                        </section>

                        <section className="grid gap-4 md:grid-cols-3">
                            {todayMetrics.map((metric) => {
                                const Icon = metric.icon;

                                return (
                                    <div key={metric.label} className="rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="text-sm font-medium text-zinc-500">{metric.label}</p>
                                            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                                                <Icon className="size-4" />
                                            </div>
                                        </div>
                                        <p className="mt-3 text-4xl font-semibold">{metric.value.toLocaleString()}</p>
                                        <p className="mt-2 text-sm text-zinc-500">{metric.detail}</p>
                                    </div>
                                );
                            })}
                        </section>

                        <section className="grid gap-4">
                            <div className="rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
                                        <Clock3 className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Latest scan</p>
                                        <p className="mt-1 text-2xl font-semibold">{lastVisit ? formatVisitTime(lastVisit) : 'No scans yet'}</p>
                                    </div>
                                </div>
                                {lastVisit ? (
                                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                                        <div>
                                            <p className="text-zinc-500">Name</p>
                                            <p className="mt-1 font-medium">{lastVisit.member.name ?? 'Unknown member'}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">ID</p>
                                            <p className="mt-1 font-medium">{lastVisit.member.schoolId ?? 'No ID'}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">{lastVisit.member.type === 'student' ? 'Year and section' : 'Department'}</p>
                                            <p className="mt-1 font-medium">
                                                {lastVisit.member.type === 'student'
                                                    ? [lastVisit.member.yearLevel, lastVisit.member.section].filter(Boolean).join(' - ') || '-'
                                                    : lastVisit.member.department || '-'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-5 text-sm text-zinc-500">Scanned students and employees will appear in the live table below.</p>
                                )}
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white/95 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="size-5 text-zinc-500" />
                                        <h2 className="text-lg font-semibold">
                                            {visitTab === 'student' ? 'Student visits today' : 'Employee visits today'}
                                        </h2>
                                    </div>
                                    <p className="mt-1 text-sm text-zinc-500">Latest RFID scans for the selected tab are shown first.</p>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder={visitTab === 'student' ? 'Search ID, name, section' : 'Search ID, name, department'}
                                            className="h-10 w-full rounded-lg border border-zinc-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 sm:w-64"
                                        />
                                    </div>
                                    <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                                        {visitTabs.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = visitTab === tab.value;

                                            return (
                                                <button
                                                    key={tab.value}
                                                    type="button"
                                                    onClick={() => setVisitTab(tab.value)}
                                                    className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition ${
                                                        isActive ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                                                    }`}
                                                >
                                                    <Icon className="size-3.5" />
                                                    {tab.label}
                                                    <span className="text-zinc-400">{tab.count}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table className={visitTab === 'student' ? 'min-w-[760px]' : 'min-w-[640px]'}>
                                    <TableHeader className="bg-zinc-50">
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
                                        {filteredVisits.length > 0 ? (
                                            filteredVisits.map((visit) => (
                                                <TableRow key={visit.id}>
                                                    <TableCell className="text-zinc-500">{formatVisitTime(visit)}</TableCell>
                                                    <TableCell className="font-medium">{visit.member.schoolId}</TableCell>
                                                    <TableCell>{visit.member.name}</TableCell>
                                                    {visitTab === 'student' ? (
                                                        <>
                                                            <TableCell className="text-zinc-500">{visit.member.yearLevel || '-'}</TableCell>
                                                            <TableCell className="text-zinc-500">{visit.member.section || '-'}</TableCell>
                                                        </>
                                                    ) : (
                                                        <TableCell className="text-zinc-500">{visit.member.department || '-'}</TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={visitTab === 'student' ? 5 : 4} className="px-5 py-14 text-center">
                                                    <p className="font-medium text-zinc-700">
                                                        {publicDashboard.todayVisits.length > 0
                                                            ? 'No records match the selected filter'
                                                            : 'No RFID visits recorded today'}
                                                    </p>
                                                    <p className="mt-2 text-sm text-zinc-500">
                                                        {publicDashboard.todayVisits.length > 0
                                                            ? 'Try another filter or search term.'
                                                            : 'Scanned student and employee visits will appear here.'}
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </section>
                    </div>
                </AdminShell>
            </main>
        </>
    );
}
