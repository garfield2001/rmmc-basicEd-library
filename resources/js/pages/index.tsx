import {
    administrationRevealDistance,
    publicScrollDeltaPerStep,
    rmmcLogoPath,
    scanErrorAutoCloseSeconds,
    scanReadyDelayMs,
} from '@/components/public/home/constants';

import type { IndexProps, LoginForm, ScanForm } from '@/components/public/home/types';

import { PublicRmmcLogo } from '@/components/public/home/PublicRmmcLogo';

import { getRestrictedRescanDetails, getScanErrorSummary } from '@/components/public/home/helpers';

import { getAdministrationStats, getAdministrationStatus, getAdminMetrics, getTodayMetrics } from '@/components/public/home/metrics';

import { useManilaClock } from '@/components/public/home/use-manila-clock';

import { PublicMetricCard } from '@/components/public/home/PublicMetricCard';

import { AdministrationStatCard } from '@/components/public/home/AdministrationStatCard';

import { AdministrationStatusCard } from '@/components/public/home/AdministrationStatusCard';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToastProvider } from '@/components/ui/toaster';
import { ScanSuccessModal } from '@/components/visits/scan-success-modal';
import { useRfidScanListener } from '@/hooks/use-rfid-scan-listener';
import { type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, ChevronDown, ChevronUp, Clock3, Info, LogIn, RadioTower, ScanLine, ShieldCheck, Timer } from 'lucide-react';

import { sidebarCollapsedStorageKey } from '@/components/admin/shell';

import { type FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';

export default function Index({ dashboard, adminDashboard }: IndexProps) {
    const { auth, name, errors, flash } = usePage<SharedData>().props;
    const isAdmin = Boolean(auth.user && adminDashboard);
    const [showLogin, setShowLogin] = useState(false);
    const [showScanError, setShowScanError] = useState(false);
    const [isAdministrationRevealed, setIsAdministrationRevealed] = useState(false);
    const [showAdministrationScrollHint, setShowAdministrationScrollHint] = useState(false);
    const [showScannerReturnButton, setShowScannerReturnButton] = useState(false);
    const [isScanSubmitting, setIsScanSubmitting] = useState(false);
    const [isScannerPreparing, setIsScannerPreparing] = useState(false);
    const [scanData, setScanDataState] = useState<ScanForm>({
        rfid_uid: '',
    });
    const [scanErrorCountdown, setScanErrorCountdown] = useState(scanErrorAutoCloseSeconds);

    const [isAdminSidebarCollapsed, setIsAdminSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
    });
    const scanInputRef = useRef<HTMLInputElement | null>(null);
    const administrationSectionRef = useRef<HTMLElement | null>(null);
    const isPublicTransitioningRef = useRef(false);
    const publicScrollStepRef = useRef(0);
    const publicScrollAmountRef = useRef(0);
    const scanSubmittingRef = useRef(false);
    const scanPreparingRef = useRef(false);
    const publicTransitionTimerRef = useRef<number | null>(null);
    const scannerReturnButtonTimerRef = useRef<number | null>(null);
    const scannerReadyTimerRef = useRef<number | null>(null);
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
    const scannerUnavailable = isScanSubmitting || isScannerPreparing;
    const loginValidationErrors = {
        email: loginErrors.email ?? (typeof errors.email === 'string' ? errors.email : undefined),
        password: loginErrors.password ?? (typeof errors.password === 'string' ? errors.password : undefined),
    };
    const scanValidationError = typeof errors.rfid_uid === 'string' ? errors.rfid_uid : undefined;
    const isRestrictedRescan = scanValidationError?.toLowerCase().includes('repeat scans are limited') ?? false;

    const { recentScanTime, allowedRescanTime } = getRestrictedRescanDetails(scanValidationError);
    const scanErrorSummary = getScanErrorSummary(scanValidationError);

    const ScanErrorIcon = isRestrictedRescan ? Info : AlertTriangle;

    useEffect(() => {
        if (showLogin) {
            return;
        }

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
    }, [showLogin]);

    useEffect(() => {
        if (isAdmin || typeof document === 'undefined') {
            return;
        }

        delete document.documentElement.dataset.adminTheme;
    }, [isAdmin]);

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
        if (scanValidationError) {
            setShowScanError(true);
        }
    }, [errors, scanValidationError]);

    useEffect(() => {
        if (!showScanError || !scanValidationError) {
            return;
        }

        setScanErrorCountdown(scanErrorAutoCloseSeconds);

        const closeTimer = window.setTimeout(() => setShowScanError(false), scanErrorAutoCloseSeconds * 1000);
        const countdownTimer = window.setInterval(() => {
            setScanErrorCountdown((currentCountdown) => Math.max(currentCountdown - 1, 1));
        }, 1000);

        return () => {
            window.clearTimeout(closeTimer);
            window.clearInterval(countdownTimer);
        };
    }, [showScanError, scanValidationError]);

    useEffect(() => {
        if (flash.recentVisit) {
            setShowScanError(false);
        }
    }, [flash.recentVisit]);

    useEffect(() => {
        if (!showLogin) {
            scanInputRef.current?.focus();
        }
    }, [showLogin]);

    useEffect(() => {
        if (!scannerUnavailable || showLogin) {
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

        const blockScanWhileUnavailable = (event: KeyboardEvent) => {
            const isScanDigit = /^\d$/.test(event.key);
            const isBufferedScanEnter = event.key === 'Enter' && scanBuffer.length > 0;

            if (!isScanDigit && !isBufferedScanEnter) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            if (isScanDigit) {
                scanBuffer += event.key;

                if (scanTimer) {
                    window.clearTimeout(scanTimer);
                }

                scanTimer = window.setTimeout(resetBuffer, 120);
                return;
            }

            resetBuffer();
        };

        window.addEventListener('keydown', blockScanWhileUnavailable, true);

        return () => {
            window.removeEventListener('keydown', blockScanWhileUnavailable, true);
            resetBuffer();
        };
    }, [scannerUnavailable, showLogin]);

    useEffect(() => {
        return () => {
            if (publicTransitionTimerRef.current) {
                window.clearTimeout(publicTransitionTimerRef.current);
            }

            if (scannerReturnButtonTimerRef.current) {
                window.clearTimeout(scannerReturnButtonTimerRef.current);
            }

            if (scannerReadyTimerRef.current) {
                window.clearTimeout(scannerReadyTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isAdmin) {
            return;
        }

        if (scannerReturnButtonTimerRef.current) {
            window.clearTimeout(scannerReturnButtonTimerRef.current);
        }

        if (!isAdministrationRevealed) {
            setShowScannerReturnButton(false);
            return;
        }

        scannerReturnButtonTimerRef.current = window.setTimeout(() => {
            setShowScannerReturnButton(true);
        }, 760);
    }, [isAdmin, isAdministrationRevealed]);

    useEffect(() => {
        if (isAdmin) {
            return;
        }

        let resizeTimer: number | null = null;

        const resetPublicPreview = () => {
            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }

            resizeTimer = window.setTimeout(() => {
                if (isAdministrationRevealed) {
                    return;
                }

                setShowAdministrationScrollHint(false);
                window.scrollTo({
                    top: 0,
                    behavior: 'instant',
                });
            }, 80);
        };

        window.addEventListener('resize', resetPublicPreview);
        document.addEventListener('fullscreenchange', resetPublicPreview);

        return () => {
            window.removeEventListener('resize', resetPublicPreview);
            document.removeEventListener('fullscreenchange', resetPublicPreview);

            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }
        };
    }, [isAdmin, isAdministrationRevealed]);

    const changeAdminSidebarCollapsed = (collapsed: boolean) => {
        setIsAdminSidebarCollapsed(collapsed);
        window.localStorage.setItem(sidebarCollapsedStorageKey, collapsed ? 'true' : 'false');
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

    const setScanData = useCallback((key: keyof ScanForm, value: string) => {
        setScanDataState((currentData) => ({
            ...currentData,
            [key]: value,
        }));
    }, []);

    const resetScan = useCallback((key?: keyof ScanForm) => {
        setScanDataState((currentData) => {
            if (!key) {
                return { rfid_uid: '' };
            }

            return {
                ...currentData,
                [key]: '',
            };
        });
    }, []);

    const releaseScanner = useCallback(() => {
        if (scannerReadyTimerRef.current) {
            window.clearTimeout(scannerReadyTimerRef.current);
            scannerReadyTimerRef.current = null;
        }

        scanPreparingRef.current = false;
        setIsScannerPreparing(false);
        resetScan('rfid_uid');
        scanInputRef.current?.focus();
    }, [resetScan]);

    const startScannerCooldown = useCallback(() => {
        if (scannerReadyTimerRef.current) {
            window.clearTimeout(scannerReadyTimerRef.current);
        }

        scanPreparingRef.current = true;
        setIsScannerPreparing(true);
        resetScan('rfid_uid');

        scannerReadyTimerRef.current = window.setTimeout(releaseScanner, scanReadyDelayMs);
    }, [releaseScanner, resetScan]);

    const finishScan = useCallback(() => {
        scanSubmittingRef.current = false;
        setIsScanSubmitting(false);
        startScannerCooldown();
    }, [startScannerCooldown]);

    const startScanSubmission = useCallback(() => {
        scanSubmittingRef.current = true;
        setIsScanSubmitting(true);
        setShowScanError(false);
    }, []);

    const recordScan = useCallback(
        (rfidUid: string) => {
            const normalizedRfidUid = rfidUid.trim();

            if (scanSubmittingRef.current || scanPreparingRef.current) {
                resetScan('rfid_uid');
                scanInputRef.current?.focus();
                return;
            }

            if (!normalizedRfidUid) {
                scanInputRef.current?.focus();
                return;
            }

            startScanSubmission();

            router.post(
                '/library-visits',
                { rfid_uid: normalizedRfidUid },
                {
                    preserveScroll: true,
                    onError: (scanErrors) => {
                        if (typeof scanErrors.rfid_uid === 'string') {
                            setShowScanError(true);
                        }
                    },
                    onFinish: finishScan,
                },
            );
        },
        [finishScan, resetScan, startScanSubmission],
    );

    const submitScan: FormEventHandler = (event) => {
        event.preventDefault();
        recordScan(scanInputRef.current?.value ?? scanData.rfid_uid);
    };

    const changeScanData = (rfidUid: string) => {
        if (scannerUnavailable) {
            resetScan('rfid_uid');
            return;
        }

        setScanData('rfid_uid', rfidUid);
    };

    const returnToScanner = () => {
        if (publicTransitionTimerRef.current) {
            window.clearTimeout(publicTransitionTimerRef.current);
        }

        isPublicTransitioningRef.current = true;
        publicScrollStepRef.current = 0;
        publicScrollAmountRef.current = 0;
        setIsAdministrationRevealed(false);
        setShowAdministrationScrollHint(false);
        setShowScannerReturnButton(false);
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });

        publicTransitionTimerRef.current = window.setTimeout(() => {
            isPublicTransitioningRef.current = false;
            scanInputRef.current?.focus();
        }, 850);
    };

    useEffect(() => {
        if (isAdmin) {
            return;
        }

        const finishPublicTransition = (delayMs = 850) => {
            if (publicTransitionTimerRef.current) {
                window.clearTimeout(publicTransitionTimerRef.current);
            }

            publicTransitionTimerRef.current = window.setTimeout(() => {
                isPublicTransitioningRef.current = false;
            }, delayMs);
        };

        const previewAdministration = () => {
            isPublicTransitioningRef.current = true;
            publicScrollStepRef.current = 1;
            setIsAdministrationRevealed(false);
            setShowAdministrationScrollHint(true);
            window.scrollTo({
                top: administrationRevealDistance,
                behavior: 'smooth',
            });
            finishPublicTransition(420);
        };

        const revealAdministration = () => {
            isPublicTransitioningRef.current = true;
            publicScrollStepRef.current = 2;
            publicScrollAmountRef.current = 2;
            setIsAdministrationRevealed(true);
            setShowAdministrationScrollHint(false);
            administrationSectionRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            finishPublicTransition();
        };

        const hideAdministration = () => {
            isPublicTransitioningRef.current = true;
            publicScrollStepRef.current = 0;
            publicScrollAmountRef.current = 0;
            setIsAdministrationRevealed(false);
            setShowAdministrationScrollHint(false);
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
            finishPublicTransition();
        };

        const lockAdministrationPosition = () => {
            const administrationTop = administrationSectionRef.current?.offsetTop;

            if (administrationTop === undefined || Math.abs(window.scrollY - administrationTop) <= 2) {
                return;
            }

            window.scrollTo({
                top: administrationTop,
                behavior: 'auto',
            });
        };

        const getWheelScrollSteps = (event: WheelEvent) => {
            if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
                return Math.abs(event.deltaY) / 3;
            }

            if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
                return Math.abs(event.deltaY) * 2;
            }

            return Math.abs(event.deltaY) / publicScrollDeltaPerStep;
        };

        const handlePublicWheel = (event: WheelEvent) => {
            if (showLogin) {
                event.preventDefault();
                return;
            }

            if (Math.abs(event.deltaY) < 2) {
                return;
            }

            event.preventDefault();

            if (event.deltaY > 0) {
                if (isAdministrationRevealed) {
                    lockAdministrationPosition();
                    return;
                }

                publicScrollAmountRef.current += getWheelScrollSteps(event);

                if (
                    publicScrollAmountRef.current >= 2 ||
                    publicScrollStepRef.current >= 1 ||
                    showAdministrationScrollHint ||
                    window.scrollY >= administrationRevealDistance - 2
                ) {
                    revealAdministration();
                    return;
                }

                previewAdministration();
                return;
            }

            if (isAdministrationRevealed || showAdministrationScrollHint || window.scrollY > 2) {
                hideAdministration();
            }
        };

        const blockPublicTouchScroll = (event: TouchEvent) => {
            if (showLogin) {
                event.preventDefault();
            }
        };

        const reconcilePublicScroll = () => {
            if (showLogin) {
                return;
            }

            if (isPublicTransitioningRef.current) {
                return;
            }

            if (isAdministrationRevealed) {
                lockAdministrationPosition();
                return;
            }

            if (!showAdministrationScrollHint && window.scrollY > 2) {
                window.scrollTo({
                    top: 0,
                    behavior: 'auto',
                });
            }
        };

        window.addEventListener('wheel', handlePublicWheel, { passive: false });
        window.addEventListener('touchmove', blockPublicTouchScroll, { passive: false });
        window.addEventListener('scroll', reconcilePublicScroll, { passive: true });

        return () => {
            window.removeEventListener('wheel', handlePublicWheel);
            window.removeEventListener('touchmove', blockPublicTouchScroll);
            window.removeEventListener('scroll', reconcilePublicScroll);
        };
    }, [isAdmin, isAdministrationRevealed, showAdministrationScrollHint, showLogin]);

    useRfidScanListener({
        enabled: !showLogin && !scannerUnavailable,
        onScanStart: startScanSubmission,
        onError: (scanErrors) => {
            if (typeof scanErrors.rfid_uid === 'string') {
                setShowScanError(true);
            }
        },
        onFinish: finishScan,
    });

    const { formattedManilaTime } = useManilaClock();

    const scannerStatusText = isScanSubmitting ? 'Recording scan' : isScannerPreparing ? 'Preparing next scan' : 'Scanner is ready';
    const scannerInstructionText = isScannerPreparing
        ? 'Please wait while the scanner prepares for the next ID.'
        : isScanSubmitting
          ? 'Please wait while this scan is being recorded.'
          : 'Place your ID near the scanner.';
    const isScannerReady = !scannerUnavailable;

    const todayMetrics = getTodayMetrics(dashboard);
    const adminMetrics = getAdminMetrics(adminDashboard);
    const administrationStats = getAdministrationStats(dashboard);
    const administrationStatus = getAdministrationStatus(dashboard);

    const maxDailyVisits = Math.max(...(adminDashboard?.charts.visitsByDay.map((point) => point.value) ?? [0]), 1);
    const totalTypeVisits = adminDashboard?.charts.visitsByType.reduce((total, point) => total + point.value, 0) || 1;

    return (
        <ToastProvider>
            <Head title="Library RFID Scanner" />

            <Dialog open={showLogin} onOpenChange={setShowLogin}>
                <DialogContent className="overflow-hidden border-[#040DBF]/20 p-0 shadow-2xl shadow-[#010440]/25 sm:max-w-md">
                    <div className="h-2 bg-[linear-gradient(90deg,#040DBF_0%,#030A8C_52%,#010440_100%)]" />
                    <div className="p-6">
                        <DialogHeader>
                            <div className="mb-2 flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-[#040DBF] text-white shadow-lg shadow-[#040DBF]/25">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl text-[#010440]">Admin login</DialogTitle>
                                    <p className="mt-1 text-sm leading-5 text-[#030A8C]">Staff access for records and library tools.</p>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={submitLogin} className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="admin-email" className="text-sm font-medium text-[#010440]">
                                    Email
                                </label>
                                <input
                                    id="admin-email"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    className="mt-2 h-11 w-full rounded-lg border border-[#030A8C]/20 bg-[#f6f8ff] px-3 text-sm text-[#010440] transition outline-none focus:border-[#040DBF] focus:bg-white focus:ring-4 focus:ring-[#040DBF]/10"
                                    autoComplete="email"
                                />
                                {loginValidationErrors.email && <p className="mt-2 text-sm text-red-600">{loginValidationErrors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="admin-password" className="text-sm font-medium text-[#010440]">
                                    Password
                                </label>
                                <input
                                    id="admin-password"
                                    type="password"
                                    value={data.password}
                                    onChange={(event) => setData('password', event.target.value)}
                                    className="mt-2 h-11 w-full rounded-lg border border-[#030A8C]/20 bg-[#f6f8ff] px-3 text-sm text-[#010440] transition outline-none focus:border-[#040DBF] focus:bg-white focus:ring-4 focus:ring-[#040DBF]/10"
                                    autoComplete="current-password"
                                />
                                {loginValidationErrors.password && <p className="mt-2 text-sm text-red-600">{loginValidationErrors.password}</p>}
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowLogin(false)}
                                    className="border-[#030A8C]/20 text-[#020659] hover:bg-[#f6f8ff]"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-[#040DBF] text-white shadow-sm hover:bg-[#030A8C]">
                                    <LogIn className="size-4" />
                                    {processing ? 'Signing in...' : 'Sign in'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            <ScanSuccessModal visit={flash.recentVisit} />

            <Dialog open={showScanError && Boolean(scanValidationError)} onOpenChange={setShowScanError}>
                <DialogContent className="min-h-[540px] overflow-hidden p-0 sm:max-w-5xl">
                    <div className={`h-3 ${isRestrictedRescan ? 'bg-[#040DBF]' : 'bg-red-600'}`} />
                    <div className="flex min-h-[537px] flex-col justify-center p-6 text-center sm:p-10">
                        <div
                            className={`mx-auto flex size-24 items-center justify-center rounded-xl ${
                                isRestrictedRescan ? 'bg-[#040DBF]/10 text-[#040DBF]' : 'bg-red-50 text-red-600'
                            }`}
                        >
                            <ScanErrorIcon className="size-12" />
                        </div>
                        <DialogHeader className="mt-5">
                            <DialogTitle className="text-center text-4xl leading-tight sm:text-5xl">
                                {isRestrictedRescan ? 'Visit already recorded' : 'Scan not recorded'}
                            </DialogTitle>
                        </DialogHeader>
                        {isRestrictedRescan ? (
                            <div className="mx-auto mt-8 w-full max-w-4xl">
                                <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
                                    <div className="rounded-lg border border-[#040DBF]/20 bg-[#040DBF] p-6 text-white shadow-xl shadow-[#010440]/20">
                                        <p className="text-sm font-semibold tracking-[0.18em] text-blue-100 uppercase">Next allowed</p>
                                        <p className="mt-3 text-6xl leading-none font-semibold tracking-normal sm:text-7xl">{allowedRescanTime}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#040DBF]/20 bg-[#f6f8ff] p-5">
                                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-[#030A8C] uppercase">
                                            <Timer className="size-4" />
                                            Closes in
                                        </div>
                                        <p className="mt-2 text-6xl leading-none font-semibold tracking-normal text-[#040DBF]">
                                            {scanErrorCountdown}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg border border-[#040DBF]/20 bg-[#f6f8ff] p-5">
                                        <p className="text-xs font-semibold tracking-[0.16em] text-[#030A8C] uppercase">Allowed rescan</p>
                                        <p className="mt-2 text-4xl font-semibold tracking-normal text-[#010440]">After 1 hour</p>
                                    </div>
                                    <div className="rounded-lg border border-[#040DBF]/20 bg-[#f6f8ff] p-5">
                                        <p className="text-xs font-semibold tracking-[0.16em] text-[#030A8C] uppercase">Recent scan</p>
                                        <p className="mt-2 text-4xl font-semibold tracking-normal text-[#010440]">{recentScanTime}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto mt-8 grid w-full max-w-3xl gap-4 sm:grid-cols-[1fr_150px]">
                                <div className="rounded-lg border border-red-200 bg-red-600 p-5 text-white shadow-lg shadow-red-950/10">
                                    <p className="text-xs font-semibold tracking-[0.18em] text-red-100 uppercase">Status</p>
                                    <p className="mt-2 text-5xl font-semibold tracking-normal">{scanErrorSummary}</p>
                                </div>
                                <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-red-700 uppercase">
                                        <Timer className="size-4" />
                                        Closes in
                                    </div>
                                    <p className="mt-2 text-6xl leading-none font-semibold tracking-normal text-red-600">{scanErrorCountdown}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {isAdmin ? (
                <main className="page-lift min-h-screen bg-zinc-100 text-zinc-950">
                    <div
                        className={`admin-theme-root admin-layout-enter grid min-h-screen transition-[grid-template-columns] duration-300 ${
                            isAdminSidebarCollapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]'
                        }`}
                    >
                        <AdminSidebar
                            active="monitor"
                            collapsed={isAdminSidebarCollapsed}
                            themePreference="system"
                            onThemePreferenceChange={() => undefined}
                        />

                        <section className="min-w-0">
                            <AdminNavbar collapsed={isAdminSidebarCollapsed} onCollapsedChange={changeAdminSidebarCollapsed} />

                            <div className="space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                                <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">Library RFID Monitor</h1>
                                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                                            Scanner-first monitoring for today&apos;s student and employee library visits.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <Clock3 className="size-4" />
                                        <span>{formattedManilaTime}</span>
                                    </div>
                                </div>

                                <form onSubmit={submitScan} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
                                                <RadioTower className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-zinc-500">RFID scanner</p>
                                                <h2 className="text-xl font-semibold">Ready to record visits</h2>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:max-w-2xl">
                                            <input
                                                id="admin-rfid-scan"
                                                ref={scanInputRef}
                                                data-rfid-scan-input="true"
                                                value={scanData.rfid_uid}
                                                onChange={(event) => changeScanData(event.target.value)}
                                                placeholder="Waiting for RFID scan"
                                                className="h-12 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                                autoComplete="off"
                                                inputMode="numeric"
                                                autoFocus
                                            />
                                            <Button type="submit" disabled={scannerUnavailable}>
                                                <ScanLine className="size-4" />
                                                {scannerUnavailable ? 'Preparing...' : 'Record'}
                                            </Button>
                                        </div>
                                    </div>
                                </form>

                                <section className="grid gap-4 md:grid-cols-3">
                                    {todayMetrics.map((metric) => (
                                        <PublicMetricCard
                                            key={metric.label}
                                            label={metric.label}
                                            value={metric.value}
                                            detail={metric.detail}
                                            icon={metric.icon}
                                        />
                                    ))}
                                </section>

                                {adminMetrics && (
                                    <section className="grid gap-4 md:grid-cols-3">
                                        {adminMetrics.map((metric) => {
                                            const Icon = metric.icon;

                                            return (
                                                <div key={metric.label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
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
                            </div>
                        </section>
                    </div>
                </main>
            ) : (
                <main className="page-lift relative min-h-screen bg-[linear-gradient(180deg,#f6f8ff_0%,#ffffff_46%,#eef2ff_100%)] text-[#010440]">
                    <section
                        className={`sticky top-0 isolate z-0 flex min-h-screen items-center overflow-hidden px-5 py-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-8 sm:py-10 ${
                            isAdministrationRevealed ? 'scale-[0.98] opacity-0' : 'scale-100 opacity-100'
                        }`}
                    >
                        <img
                            src={rmmcLogoPath}
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[76vmin] max-h-[820px] min-h-[420px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.11] saturate-125"
                        />
                        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-center lg:gap-14">
                            <div className="min-w-0">
                                <div className="flex items-center gap-4 sm:gap-5">
                                    <PublicRmmcLogo />
                                    <div className="min-w-0">
                                        <p className="max-w-xl text-lg leading-6 font-semibold text-[#010440] sm:text-2xl sm:leading-8">{name}</p>
                                        <p className="mt-1 text-sm text-[#030A8C] sm:text-lg">Library attendance station</p>
                                    </div>
                                </div>

                                <div className="mt-10 max-w-3xl sm:mt-14">
                                    <h1 className="text-5xl leading-[0.96] font-semibold tracking-normal text-[#010440] sm:text-7xl lg:text-8xl">
                                        Scan your library ID
                                    </h1>
                                    <p className="mt-6 max-w-2xl text-lg leading-7 text-[#020659] sm:text-2xl sm:leading-9">
                                        Approved or not, the scan result will appear clearly on this screen after every scan.
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={submitScan}
                                className="relative flex min-h-[300px] flex-col items-center justify-center border-y border-[#040DBF]/15 py-8 text-center sm:min-h-[380px] sm:py-10 lg:min-h-[460px]"
                            >
                                <input
                                    id="public-rfid-scan"
                                    ref={scanInputRef}
                                    data-rfid-scan-input="true"
                                    value={scanData.rfid_uid}
                                    onChange={(event) => changeScanData(event.target.value)}
                                    className="sr-only"
                                    autoComplete="off"
                                    inputMode="numeric"
                                    autoFocus
                                    aria-label="RFID scanner input"
                                />

                                <div
                                    className={`flex size-32 items-center justify-center rounded-full border bg-white/95 shadow-2xl ring-8 transition-colors duration-300 sm:size-40 ${
                                        isScannerReady
                                            ? 'border-[#040DBF]/25 text-[#040DBF] shadow-[#040DBF]/15 ring-[#040DBF]/5'
                                            : 'border-red-500/30 text-red-600 shadow-red-500/15 ring-red-500/10'
                                    }`}
                                >
                                    <RadioTower className="size-14 sm:size-18" />
                                </div>
                                <p className="mt-7 text-3xl font-semibold tracking-normal text-[#010440] sm:mt-8 sm:text-5xl">{scannerStatusText}</p>
                                <p className="mt-3 max-w-md text-lg leading-7 text-[#020659] sm:mt-4 sm:text-2xl sm:leading-9">
                                    {scannerInstructionText}
                                </p>
                                <p className="mt-7 rounded-lg border border-[#030A8C]/15 bg-white/90 px-4 py-2.5 text-base font-medium text-[#010440] shadow-sm shadow-[#010440]/5 sm:mt-8 sm:px-5 sm:py-3 sm:text-xl">
                                    {formattedManilaTime}
                                </p>
                            </form>
                        </div>
                    </section>

                    <section
                        ref={administrationSectionRef}
                        className="relative z-10 flex min-h-screen items-center border-t border-[#040DBF]/20 bg-[linear-gradient(180deg,#010440_0%,#020659_100%)] px-5 py-8 text-white sm:px-8 sm:py-10"
                    >
                        {showAdministrationScrollHint && (
                            <div
                                className="pointer-events-none absolute top-8 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center bg-transparent text-white/90 drop-shadow-lg motion-safe:animate-bounce sm:top-10"
                                aria-hidden="true"
                            >
                                <ChevronDown className="size-14 sm:size-16" />
                            </div>
                        )}

                        <div
                            className={`mx-auto w-full max-w-6xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                isAdministrationRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-85'
                            }`}
                        >
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                                <div className="max-w-3xl">
                                    <p className="text-sm font-semibold text-blue-200">Staff Area</p>
                                    <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Administration and records</h2>
                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:mt-4 sm:text-base sm:leading-7">
                                        Library staff can sign in here to manage member profiles, verify visit activity, export attendance records,
                                        and maintain scanner settings.
                                    </p>
                                </div>

                                <Button
                                    onClick={() => setShowLogin(true)}
                                    className="h-12 w-full shrink-0 bg-[#040DBF] px-6 text-white shadow-lg shadow-[#040DBF]/25 hover:bg-white hover:text-[#010440] sm:w-auto"
                                >
                                    <LogIn className="size-4" />
                                    Admin login
                                </Button>
                            </div>

                            <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
                                <div className="divide-y divide-white/15 border-y border-white/15">
                                    {administrationStats.map((stat) => (
                                        <AdministrationStatCard
                                            key={stat.label}
                                            label={stat.label}
                                            value={stat.value}
                                            detail={stat.detail}
                                            icon={stat.icon}
                                        />
                                    ))}
                                </div>

                                <div className="border-y border-white/15 py-4 sm:py-5">
                                    <p className="text-sm font-semibold text-blue-200">Current setup</p>
                                    <div className="mt-5 space-y-5">
                                        {administrationStatus.map((item) => (
                                            <AdministrationStatusCard
                                                key={item.label}
                                                label={item.label}
                                                value={item.value}
                                                detail={item.detail}
                                                icon={item.icon}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-6 border-t border-white/15 pt-5">
                                        <p className="text-sm leading-6 text-blue-100">
                                            Administrative tools are kept behind staff login so the scanner station stays focused on visitor flow.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isAdministrationRevealed && (
                            <Button
                                type="button"
                                onClick={returnToScanner}
                                aria-label="Show scanner page"
                                className={`group fixed right-5 bottom-5 z-30 h-14 w-14 gap-0 overflow-hidden rounded-full border border-white/20 bg-[#040DBF] p-0 text-white shadow-2xl shadow-[#010440]/45 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-52 hover:animate-none hover:gap-2 hover:bg-[#030A8C] hover:pr-4 hover:pl-2 motion-safe:animate-bounce sm:right-8 sm:bottom-8 ${
                                    showScannerReturnButton
                                        ? 'translate-y-0 scale-100 opacity-100'
                                        : 'pointer-events-none translate-y-5 scale-95 opacity-0'
                                }`}
                            >
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-transparent text-white">
                                    <ChevronUp className="size-7" />
                                </span>
                                <span className="max-w-0 overflow-hidden font-semibold whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-36 group-hover:opacity-100">
                                    Return to scanner
                                </span>
                            </Button>
                        )}
                    </section>
                </main>
            )}
        </ToastProvider>
    );
}
