import { ForcedLogoutListener } from '@/components/auth/forced-logout-listener';
import { AdminLoginDialog } from '@/components/public/home/admin-login-dialog';
import { AdministrationSection } from '@/components/public/home/administration-section';
import { LoginPreloaderOverlay } from '@/components/public/home/login-preloader-overlay';
import { ScanErrorDialog } from '@/components/public/home/scan-error-dialog';
import { ScannerSection } from '@/components/public/home/scanner-section';
import type { IndexProps } from '@/components/public/home/types';
import { useAdminLogin } from '@/components/public/home/use-admin-login';
import { useManilaClock } from '@/components/public/home/use-manila-clock';
import { usePublicAdministrationScroll } from '@/components/public/home/use-public-administration-scroll';
import { usePublicScanner } from '@/components/public/home/use-public-scanner';
import { useScanErrorDialog } from '@/components/public/home/use-scan-error-dialog';
import { ToastProvider } from '@/components/ui/toaster';
import { ScanSuccessModal } from '@/components/visits/scan-success-modal';
import type { DashboardVisit } from '@/types/dashboard';
import { type SharedData } from '@/types/shared';
import { Head, router, usePage } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { useCallback, useEffect, useState } from 'react';

export default function Index({ home }: IndexProps) {
    const { name, errors, flash, auth } = usePage<SharedData>().props;
    const [showLogin, setShowLogin] = useState(false);
    const [broadcastVisit, setBroadcastVisit] = useState<DashboardVisit | null>(null);
    const scanValidationError = typeof errors.rfid_uid === 'string' ? errors.rfid_uid : undefined;
    const { formattedManilaTime } = useManilaClock();
    const login = useAdminLogin();
    const {
        isOpen: isScanErrorOpen,
        setIsOpen: setScanErrorOpen,
        countdown: scanErrorCountdown,
    } = useScanErrorDialog(scanValidationError, flash.recentVisit, home.scanSettings.error_modal_close_seconds);
    const closeScanError = useCallback(() => setScanErrorOpen(false), [setScanErrorOpen]);
    const openScanError = useCallback(() => setScanErrorOpen(true), [setScanErrorOpen]);
    const scanner = usePublicScanner({
        enabled: !showLogin,
        cooldownSeconds: home.scanSettings.scanner_cooldown_seconds,
        onScanStart: closeScanError,
        onScanError: openScanError,
    });
    const administration = usePublicAdministrationScroll({
        loginOpen: showLogin,
        scannerInputRef: scanner.inputRef,
    });

    useEchoPublic<{ visit: DashboardVisit }>('library-visits', '.LibraryVisitRecorded', (event) => {
        setBroadcastVisit(event.visit);
    });

    useEffect(() => {
        delete document.documentElement.dataset.adminTheme;
        document.documentElement.style.colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'only light';
    }, []);

    useEffect(() => {
        document.documentElement.classList.add('public-scrollbar-hidden');

        return () => document.documentElement.classList.remove('public-scrollbar-hidden');
    }, []);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);

        if (searchParams.get('login') !== '1') {
            return;
        }

        if (auth.user) {
            router.visit('/admin');
            return;
        }

        setShowLogin(true);
        searchParams.delete('login');

        const nextSearch = searchParams.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`);
    }, [auth.user]);

    useEffect(() => {
        if (login.errors.email || login.errors.password) {
            setShowLogin(true);
        }
    }, [login.errors.email, login.errors.password]);

    const openAdminAccess = () => {
        if (auth.user) {
            router.visit('/admin');
            return;
        }

        setShowLogin(true);
    };

    const scannerStatusText = scanner.isSubmitting ? 'Recording scan' : scanner.isPreparing ? 'Preparing next scan' : 'Scanner is ready';
    const scannerInstructionText = scanner.isPreparing
        ? 'Please wait while the scanner prepares for the next ID.'
        : scanner.isSubmitting
          ? 'Please wait while this scan is being recorded.'
          : 'Place your ID near the scanner.';

    return (
        <ToastProvider>
            <ForcedLogoutListener />
            <Head title="Library RFID Scanner" />

            <AdminLoginDialog
                open={showLogin}
                onOpenChange={setShowLogin}
                data={login.data}
                errors={login.errors}
                processing={login.processing || login.loadingAdmin}
                onEmailChange={login.setEmail}
                onPasswordChange={login.setPassword}
                onSubmit={login.submit}
            />
            <LoginPreloaderOverlay visible={login.loadingAdmin} />

            <ScanSuccessModal visit={broadcastVisit ?? flash.recentVisit} closeAfterSeconds={home.scanSettings.success_modal_close_seconds} />

            <ScanErrorDialog open={isScanErrorOpen} error={scanValidationError} countdown={scanErrorCountdown} onOpenChange={setScanErrorOpen} />

            <main className="page-lift relative min-h-screen bg-[linear-gradient(180deg,#f6f8ff_0%,#ffffff_46%,#eef2ff_100%)] text-[#010440]">
                <ScannerSection
                    schoolName={name}
                    data={scanner.data}
                    inputRef={scanner.inputRef}
                    isAdministrationRevealed={administration.isAdministrationRevealed}
                    isScannerReady={scanner.isReady}
                    isScannerPreparing={scanner.isPreparing}
                    isScannerSubmitting={scanner.isSubmitting}
                    statusText={scannerStatusText}
                    instructionText={scannerInstructionText}
                    formattedManilaTime={formattedManilaTime}
                    onScanChange={scanner.changeScanData}
                    onSubmit={scanner.submitScan}
                    onAdminClick={openAdminAccess}
                />

                <AdministrationSection
                    home={home}
                    sectionRef={administration.administrationSectionRef}
                    isRevealed={administration.isAdministrationRevealed}
                    showScrollHint={administration.showAdministrationScrollHint}
                    showReturnButton={administration.showScannerReturnButton}
                    onLoginClick={openAdminAccess}
                    onReturnToScanner={administration.returnToScanner}
                />
            </main>
        </ToastProvider>
    );
}
