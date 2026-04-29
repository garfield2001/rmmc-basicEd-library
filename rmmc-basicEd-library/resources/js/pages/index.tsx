import { AdminNavbar, AdminSidebar } from '@/components/admin-shell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToastProvider } from '@/components/ui/toaster';
import { type AdminDashboard, type DashboardVisit, type PublicDashboard, type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BriefcaseBusiness,
    Clock3,
    GraduationCap,
    Info,
    LogIn,
    RadioTower,
    ScanLine,
    Search,
    ShieldCheck,
    UsersRound,
    X,
} from 'lucide-react';
import { type FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

interface IndexProps {
    dashboard: PublicDashboard;
    adminDashboard: AdminDashboard | null;
}

const introStorageKey = 'rmmc-library-public-monitor-intro-seen-v1';
const publicInfoStorageKey = 'rmmc-library-public-monitor-info-dismissed-v1';
type VisitFilter = 'all' | 'student' | 'employee';
interface LoginForm {
    [key: string]: string;
    email: string;
    password: string;
}

interface ScanForm {
    [key: string]: string;
    rfid_uid: string;
}

export default function Index({ dashboard, adminDashboard }: IndexProps) {
    const { auth, name, errors } = usePage<SharedData>().props;
    const isAdmin = Boolean(auth.user && adminDashboard);
    const [showIntro, setShowIntro] = useState(false);
    const [showPublicInfo, setShowPublicInfo] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [visitFilter, setVisitFilter] = useState<Exclude<VisitFilter, 'all'>>('student');
    const [search, setSearch] = useState('');
    const [manilaTime, setManilaTime] = useState(() => new Date());
    const scanInputRef = useRef<HTMLInputElement | null>(null);
    const lastVisit = dashboard.todayVisits[0];
    const {
        data,
        setData,
        post,
        processing,
        reset,
        errors: loginErrors,
    } = useForm<LoginForm>({
        email: '',
        password: '',
    });
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
    const loginValidationErrors = {
        email: loginErrors.email ?? (typeof errors.email === 'string' ? errors.email : undefined),
        password: loginErrors.password ?? (typeof errors.password === 'string' ? errors.password : undefined),
    };

    useEffect(() => {
        if (window.localStorage.getItem(introStorageKey) !== 'true') {
            setShowIntro(true);
        }
    }, []);

    useEffect(() => {
        if (!isAdmin && window.localStorage.getItem(publicInfoStorageKey) !== 'true') {
            setShowPublicInfo(true);
        }
    }, [isAdmin]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            router.get(
                window.location.pathname,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                    only: ['dashboard'],
                },
            );
        }, 15000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => setManilaTime(new Date()), 1000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);

        if (searchParams.get('login') !== '1') {
            return;
        }

        setShowLogin(true);
        searchParams.delete('login');

        const nextSearch = searchParams.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`);
    }, []);

    useEffect(() => {
        if (loginValidationErrors.email || loginValidationErrors.password) {
            setShowLogin(true);
        }
    }, [loginValidationErrors.email, loginValidationErrors.password]);

    useEffect(() => {
        if (!showIntro && !showLogin) {
            scanInputRef.current?.focus();
        }
    }, [showIntro, showLogin]);

    const closeIntro = () => {
        window.localStorage.setItem(introStorageKey, 'true');
        setShowIntro(false);
    };

    const closePublicInfo = () => {
        window.localStorage.setItem(publicInfoStorageKey, 'true');
        setShowPublicInfo(false);
    };

    const submitLogin: FormEventHandler = (event) => {
        event.preventDefault();

        post('/login', {
            preserveScroll: true,
            onSuccess: () => {
                reset('password');
                setShowLogin(false);
            },
            onFinish: () => reset('password'),
        });
    };

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
        if (showIntro || showLogin) {
            return;
        }

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
    }, [showIntro, showLogin]);

    const filteredVisits = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return dashboard.todayVisits.filter((visit) => {
            const matchesFilter = visit.member.type === visitFilter;
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

            return matchesFilter && (!normalizedSearch || searchable.includes(normalizedSearch));
        });
    }, [dashboard.todayVisits, search, visitFilter]);

    const todayMetrics = [
        {
            label: 'Visits today',
            value: dashboard.metrics.visitsToday,
            detail: 'RFID scans since midnight',
            icon: ScanLine,
        },
        {
            label: 'Students',
            value: dashboard.metrics.studentVisitsToday,
            detail: 'Student entries logged',
            icon: GraduationCap,
        },
        {
            label: 'Employees',
            value: dashboard.metrics.employeeVisitsToday,
            detail: 'Employee entries logged',
            icon: BriefcaseBusiness,
        },
    ];

    const adminMetrics = adminDashboard && [
        {
            label: 'Active members',
            value: adminDashboard.metrics.activeMembers,
            detail: 'Can record RFID visits',
            icon: UsersRound,
        },
        {
            label: 'Inactive members',
            value: adminDashboard.metrics.inactiveMembers,
            detail: 'Retained for records',
            icon: ShieldCheck,
        },
        {
            label: 'School year visits',
            value: adminDashboard.metrics.visitsThisSchoolYear,
            detail: 'Total logs this school year',
            icon: BarChart3,
        },
    ];

    const filterButtons: { label: string; value: Exclude<VisitFilter, 'all'>; count: number; icon: typeof ShieldCheck }[] = [
        { label: 'Students', value: 'student', count: dashboard.metrics.studentVisitsToday, icon: GraduationCap },
        { label: 'Employees', value: 'employee', count: dashboard.metrics.employeeVisitsToday, icon: BriefcaseBusiness },
    ];

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

    const maxDailyVisits = Math.max(...(adminDashboard?.charts.visitsByDay.map((point) => point.value) ?? [0]), 1);
    const totalTypeVisits = adminDashboard?.charts.visitsByType.reduce((total, point) => total + point.value, 0) || 1;

    return (
        <ToastProvider>
            <Head title="Today's Library Monitor" />

            <Dialog open={showIntro} onOpenChange={(open) => (!open ? closeIntro() : setShowIntro(true))}>
                <DialogContent>
                    <DialogHeader>
                        <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
                            <Info className="size-5" />
                        </div>
                        <DialogTitle>Welcome to the public library monitor</DialogTitle>
                        <DialogDescription>
                            This screen is for day-to-day monitoring only. It shows today&apos;s RFID visit activity for students and employees on
                            this device.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 text-sm">
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                            <p className="font-medium">Public view</p>
                            <p className="mt-1 text-zinc-500">Anyone can view today&apos;s attendance monitor without logging in.</p>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                            <p className="font-medium">Admin tools</p>
                            <p className="mt-1 text-zinc-500">
                                Reports, RFID registration, member management, exports, and settings require an admin login.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        {!isAdmin && (
                            <Button variant="outline" onClick={() => setShowLogin(true)}>
                                <LogIn className="size-4" />
                                Admin login
                            </Button>
                        )}
                        <Button onClick={closeIntro}>Got it</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showLogin} onOpenChange={setShowLogin}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
                            <ShieldCheck className="size-5" />
                        </div>
                        <DialogTitle>Admin login</DialogTitle>
                        {/* <DialogDescription>Sign in to unlock member management, reports, exports, and administrative monitoring.</DialogDescription> */}
                    </DialogHeader>

                    <form onSubmit={submitLogin} className="space-y-4">
                        <div>
                            <label htmlFor="admin-email" className="text-sm font-medium">
                                Email
                            </label>
                            <input
                                id="admin-email"
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                className="mt-2 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                autoComplete="email"
                            />
                            {loginValidationErrors.email && <p className="mt-2 text-sm text-red-600">{loginValidationErrors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="text-sm font-medium">
                                Password
                            </label>
                            <input
                                id="admin-password"
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                className="mt-2 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                autoComplete="current-password"
                            />
                            {loginValidationErrors.password && <p className="mt-2 text-sm text-red-600">{loginValidationErrors.password}</p>}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowLogin(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <LogIn className="size-4" />
                                {processing ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <main className="page-lift min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                {!isAdmin && (
                    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
                        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-sm">
                                    <ScanLine className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{name}</p>
                                    <p className="text-xs text-zinc-500">Library RFID attendance monitor</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button onClick={() => setShowLogin(true)}>
                                    <LogIn className="size-4" />
                                    Admin login
                                </Button>
                            </div>
                        </div>
                    </header>
                )}

                <div className={isAdmin ? 'admin-layout-enter grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]' : 'mx-auto max-w-7xl px-6 py-8'}>
                    {isAdmin && <AdminSidebar active="monitor" />}

                    <section className={isAdmin ? 'min-w-0' : 'space-y-6'}>
                        {isAdmin && <AdminNavbar />}

                        <div className={isAdmin ? 'space-y-6 px-4 py-6 sm:px-6 lg:py-8' : 'space-y-6'}>
                            <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    {dashboard.schoolYear && (
                                        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                                            <ShieldCheck className="size-3.5" />
                                            {dashboard.schoolYear.name}
                                        </div>
                                    )}
                                    <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">Today&apos;s Library Monitoring</h1>
                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                                        {isAdmin
                                            ? 'Detailed operations monitor for RFID attendance, member status, and visit trends.'
                                            : 'Public attendance view for RFID scans recorded today.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <Clock3 className="size-4" />
                                    <span>{formattedManilaTime}</span>
                                </div>
                            </div>

                            <section className={`grid gap-4 ${isAdmin || showPublicInfo ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
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

                                {isAdmin ? (
                                    <div className="rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                                        <p className="text-sm font-medium text-zinc-500">{isAdmin ? 'Admin detail level' : 'Public detail level'}</p>
                                        <p className="mt-2 text-2xl font-semibold">{isAdmin ? 'Expanded monitor' : 'Limited monitor'}</p>
                                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                                            {isAdmin
                                                ? 'Sidebar tools, member counts, school-year totals, and charts are available.'
                                                : 'Only today’s visit flow is shown here. Admin details unlock after login.'}
                                        </p>
                                    </div>
                                ) : (
                                    showPublicInfo && (
                                        <aside className="relative rounded-xl border border-zinc-200 bg-white/90 p-5 pr-12 shadow-sm">
                                            <button
                                                type="button"
                                                onClick={closePublicInfo}
                                                className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
                                                aria-label="Hide public monitor notice"
                                            >
                                                <X className="size-4" />
                                            </button>
                                            <p className="text-sm font-medium text-zinc-500">Public monitor</p>
                                            <p className="mt-2 text-2xl font-semibold">Today&apos;s visit flow</p>
                                            <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-500">
                                                <p>RFID scans are recorded for the active school year and shown in today&apos;s attendance feed.</p>
                                                <p>Public view shows daily counts and recent student or employee visits only.</p>
                                                <p>Admin login unlocks member registration, reports, exports, and school-year totals.</p>
                                            </div>
                                        </aside>
                                    )
                                )}
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

                            {isAdmin && adminMetrics && (
                                <section className="grid gap-4 md:grid-cols-3">
                                    {adminMetrics.map((metric) => {
                                        const Icon = metric.icon;

                                        return (
                                            <div key={metric.label} className="rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="text-sm font-medium text-zinc-500">{metric.label}</p>
                                                    <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                                                        <Icon className="size-4" />
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-3xl font-semibold">{metric.value.toLocaleString()}</p>
                                                <p className="mt-2 text-sm text-zinc-500">{metric.detail}</p>
                                            </div>
                                        );
                                    })}
                                </section>
                            )}

                            {isAdmin && adminDashboard && (
                                <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                                    <div className="rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-lg font-semibold">Visits this week</h2>
                                                <p className="mt-1 text-sm text-zinc-500">Daily RFID scans across students and employees.</p>
                                            </div>
                                            <BarChart3 className="size-5 text-zinc-400" />
                                        </div>
                                        <div className="mt-6 flex h-48 items-end gap-3">
                                            {adminDashboard.charts.visitsByDay.map((point) => (
                                                <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                                                    <div className="flex h-36 w-full items-end rounded-lg bg-zinc-50 px-2">
                                                        <div
                                                            className="w-full rounded-t-md bg-zinc-950 transition-all"
                                                            style={{
                                                                height: `${Math.max((point.value / maxDailyVisits) * 100, point.value > 0 ? 8 : 0)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-xs font-medium text-zinc-500">{point.label}</p>
                                                    <p className="text-xs text-zinc-400">{point.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                                        <h2 className="text-lg font-semibold">Visit distribution</h2>
                                        <p className="mt-1 text-sm text-zinc-500">Student and employee attendance share.</p>
                                        <div className="mt-6 space-y-4">
                                            {adminDashboard.charts.visitsByType.map((point) => (
                                                <div key={point.label}>
                                                    <div className="mb-2 flex justify-between text-sm">
                                                        <span className="font-medium">{point.label}</span>
                                                        <span className="text-zinc-500">{point.value.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-3 rounded-full bg-zinc-100">
                                                        <div
                                                            className="h-3 rounded-full bg-zinc-950"
                                                            style={{ width: `${Math.round((point.value / totalTypeVisits) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

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
                                                <p className="text-zinc-500">
                                                    {lastVisit.member.type === 'student' ? 'Year and section' : 'Department'}
                                                </p>
                                                <p className="mt-1 font-medium">
                                                    {lastVisit.member.type === 'student'
                                                        ? [lastVisit.member.yearLevel, lastVisit.member.section].filter(Boolean).join(' - ') || '-'
                                                        : lastVisit.member.department || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-5 text-sm text-zinc-500">
                                            Scanned students and employees will appear in the live table below.
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white/95 shadow-sm">
                                <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="size-5 text-zinc-500" />
                                            <h2 className="text-lg font-semibold">
                                                {visitFilter === 'student' ? 'Student visits today' : 'Employee visits today'}
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
                                                placeholder={visitFilter === 'student' ? 'Search ID, name, section' : 'Search ID, name, department'}
                                                className="h-10 w-full rounded-lg border border-zinc-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 sm:w-64"
                                            />
                                        </div>
                                        <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                                            {filterButtons.map((filter) => {
                                                const Icon = filter.icon;
                                                const isActive = visitFilter === filter.value;

                                                return (
                                                    <button
                                                        key={filter.value}
                                                        type="button"
                                                        onClick={() => setVisitFilter(filter.value)}
                                                        className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition ${
                                                            isActive ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                                                        }`}
                                                    >
                                                        <Icon className="size-3.5" />
                                                        {filter.label}
                                                        <span className="text-zinc-400">{filter.count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table className={visitFilter === 'student' ? 'min-w-[760px]' : 'min-w-[640px]'}>
                                        <TableHeader className="bg-zinc-50">
                                            <TableRow>
                                                <TableHead>Time</TableHead>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                {visitFilter === 'student' ? (
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
                                                        {visitFilter === 'student' ? (
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
                                                    <TableCell colSpan={visitFilter === 'student' ? 5 : 4} className="px-5 py-14 text-center">
                                                        <p className="font-medium text-zinc-700">
                                                            {dashboard.todayVisits.length > 0
                                                                ? 'No records match the selected filter'
                                                                : 'No RFID visits recorded today'}
                                                        </p>
                                                        <p className="mt-2 text-sm text-zinc-500">
                                                            {dashboard.todayVisits.length > 0
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
                    </section>
                </div>
            </main>
        </ToastProvider>
    );
}
