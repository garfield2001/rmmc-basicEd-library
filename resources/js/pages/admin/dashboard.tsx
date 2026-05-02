import { AdminPageHeader, AdminShell } from '@/components/admin/shell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LatestVisitCard } from '@/components/visits/latest-visit-card';
import { ScanLookupInput } from '@/components/visits/scan-lookup-input';
import { ScanSuccessModal } from '@/components/visits/scan-success-modal';
import { useRfidScanListener } from '@/hooks/use-rfid-scan-listener';
import { type AdminDashboard, type AdminVisitMonitor, type DashboardVisit, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { BarChart3, BriefcaseBusiness, Clock3, GraduationCap, Library, RadioTower, ScanLine, Search } from 'lucide-react';
import { type FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

interface AdminDashboardProps {
    dashboard: AdminDashboard;
    visitMonitor: AdminVisitMonitor;
}

interface ScanForm {
    [key: string]: string;
    rfid_uid: string;
}

type VisitTab = 'student' | 'employee';

export default function Dashboard({ dashboard, visitMonitor }: AdminDashboardProps) {
    const { flash } = usePage<SharedData>().props;
    const [visitTab, setVisitTab] = useState<VisitTab>('student');
    const [search, setSearch] = useState('');
    const [manilaTime, setManilaTime] = useState(() => new Date());
    const scanInputRef = useRef<HTMLInputElement | null>(null);
    const lastVisit = visitMonitor.todayVisits[0];
    const {
        data: scanData,
        setData: setScanData,
        post: postScan,
        processing: scanning,
        reset: resetScan,
    } = useForm<ScanForm>({
        rfid_uid: '',
    });
    const scanTargetOptions = useMemo(() => {
        return (visitMonitor.scanTargets ?? []).map((target) => ({
            value: target.rfidUid,
            label: target.name,
            meta: `${target.schoolId} - ${target.type}${target.detail ? ` - ${target.detail}` : ''}`,
            idTerms: [target.schoolId, ...target.schoolId.split(/[^a-zA-Z0-9]+/)].filter((term): term is string => Boolean(term)),
            textTerms: [target.name, target.firstName, target.lastName, target.type, target.detail].filter((term): term is string => Boolean(term)),
        }));
    }, [visitMonitor.scanTargets]);

    const todayMetrics = [
        {
            label: 'Visits today',
            value: visitMonitor.metrics.visitsToday,
            detail: 'RFID scans since midnight',
            icon: Library,
        },
        {
            label: 'Students',
            value: visitMonitor.metrics.studentVisitsToday,
            detail: 'Student entries logged',
            icon: GraduationCap,
        },
        {
            label: 'Employees',
            value: visitMonitor.metrics.employeeVisitsToday,
            detail: 'Employee entries logged',
            icon: BriefcaseBusiness,
        },
    ];

    const visitTabs: { label: string; value: VisitTab; count: number; icon: typeof GraduationCap }[] = [
        { label: 'Students', value: 'student', count: visitMonitor.metrics.studentVisitsToday, icon: GraduationCap },
        { label: 'Employees', value: 'employee', count: visitMonitor.metrics.employeeVisitsToday, icon: BriefcaseBusiness },
    ];

    const filteredVisits = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return visitMonitor.todayVisits.filter((visit) => {
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
    }, [visitMonitor.todayVisits, search, visitTab]);

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
            onFinish: () => {
                resetScan('rfid_uid');
                scanInputRef.current?.focus();
            },
        });
    };

    useEffect(() => {
        scanInputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (lastVisit?.member.type === 'student' || lastVisit?.member.type === 'employee') {
            setVisitTab(lastVisit.member.type);
        }
    }, [lastVisit?.id, lastVisit?.member.type]);

    useEffect(() => {
        const interval = window.setInterval(() => setManilaTime(new Date()), 1000);

        return () => window.clearInterval(interval);
    }, []);

    useRfidScanListener({
        onFinish: () => {
            resetScan('rfid_uid');
            scanInputRef.current?.focus();
        },
    });

    return (
        <>
            <Head title="Live Visits" />
            <ScanSuccessModal visit={flash.recentVisit} />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminShell active="monitor">
                    <div className="space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Live Visits"
                            description="Detailed operations monitor for RFID attendance, today's visit flow, and student or employee entries."
                            actions={
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <Clock3 className="size-4" />
                                    <span>{formattedManilaTime}</span>
                                </div>
                            }
                        />

                        <section className="grid gap-4">
                            <form onSubmit={submitScan} className="rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
                                            <RadioTower className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-zinc-500">RFID scanner</p>
                                            <h2 className="text-xl font-semibold">Record a library visit</h2>
                                        </div>
                                    </div>

                                    <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-lg">
                                        <ScanLookupInput
                                            id="admin-scan-lookup"
                                            ref={scanInputRef}
                                            value={scanData.rfid_uid}
                                            options={scanTargetOptions}
                                            onChange={(value) => setScanData('rfid_uid', value)}
                                            placeholder="Scan card or type name / school ID"
                                            className="w-full"
                                            autoFocus
                                        />
                                        <Button type="submit" disabled={scanning} className="h-11 shrink-0 px-5">
                                            <ScanLine className="size-4" />
                                            {scanning ? 'Recording...' : 'Record visit'}
                                        </Button>
                                    </div>
                                </div>
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

                        <LatestVisitCard
                            visit={lastVisit ?? null}
                            emptyMessage="Scanned students and employees will appear in the live table below."
                        />

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
                                                        {visitMonitor.todayVisits.length > 0
                                                            ? 'No records match the selected filter'
                                                            : 'No RFID visits recorded today'}
                                                    </p>
                                                    <p className="mt-2 text-sm text-zinc-500">
                                                        {visitMonitor.todayVisits.length > 0
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
