import { AdminLoginDialog } from '@/components/public/home/admin-login-dialog';
import { AdministrationSection } from '@/components/public/home/administration-section';
import { ScanErrorDialog } from '@/components/public/home/scan-error-dialog';
import { ScannerSection } from '@/components/public/home/scanner-section';
import type { IndexProps, LoginForm } from '@/components/public/home/types';
import { useManilaClock } from '@/components/public/home/use-manila-clock';
import { usePublicAdministrationScroll } from '@/components/public/home/use-public-administration-scroll';
import { usePublicScanner } from '@/components/public/home/use-public-scanner';
import { useScanErrorDialog } from '@/components/public/home/use-scan-error-dialog';
import { ToastProvider } from '@/components/ui/toaster';
import { ScanSuccessModal } from '@/components/visits/scan-success-modal';
import { type SharedData } from '@/types/shared';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { type FormEventHandler, useCallback, useEffect, useState } from 'react';

export default function Index({ home }: IndexProps) {
    const { name, errors, flash, auth } = usePage<SharedData>().props;
    const [showLogin, setShowLogin] = useState(false);
    const scanValidationError = typeof errors.rfid_uid === 'string' ? errors.rfid_uid : undefined;
    const { formattedManilaTime } = useManilaClock();
    const {
        data: loginData,
        setData: setLoginData,
        post: postLogin,
        processing: loginProcessing,
        reset: resetLogin,
        errors: loginErrors,
    } = useForm<LoginForm>({ email: '', password: '' });
    const loginValidationErrors = {
        email: loginErrors.email ?? (typeof errors.email === 'string' ? errors.email : undefined),
        password: loginErrors.password ?? (typeof errors.password === 'string' ? errors.password : undefined),
    };
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

    useEffect(() => {
        delete document.documentElement.dataset.adminTheme;
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
        if (loginValidationErrors.email || loginValidationErrors.password) {
            setShowLogin(true);
        }
    }, [loginValidationErrors.email, loginValidationErrors.password]);

    const submitLogin: FormEventHandler = (event) => {
        event.preventDefault();

        postLogin('/login', {
            preserveScroll: true,
            onSuccess: () => {
                resetLogin('password');
                setShowLogin(false);
            },
            onFinish: () => resetLogin('password'),
        });
    };

    const scannerStatusText = scanner.isSubmitting ? 'Recording scan' : scanner.isPreparing ? 'Preparing next scan' : 'Scanner is ready';
    const scannerInstructionText = scanner.isPreparing
        ? 'Please wait while the scanner prepares for the next ID.'
        : scanner.isSubmitting
          ? 'Please wait while this scan is being recorded.'
          : 'Place your ID near the scanner.';

    return (
        <ToastProvider>
            <Head title="Library RFID Scanner" />

            <AdminLoginDialog
                open={showLogin}
                onOpenChange={setShowLogin}
                data={loginData}
                errors={loginValidationErrors}
                processing={loginProcessing}
                onEmailChange={(value) => setLoginData('email', value)}
                onPasswordChange={(value) => setLoginData('password', value)}
                onSubmit={submitLogin}
            />

            <ScanSuccessModal visit={flash.recentVisit} closeAfterSeconds={home.scanSettings.success_modal_close_seconds} />

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
                />

                <AdministrationSection
                    home={home}
                    sectionRef={administration.administrationSectionRef}
                    isRevealed={administration.isAdministrationRevealed}
                    showScrollHint={administration.showAdministrationScrollHint}
                    showReturnButton={administration.showScannerReturnButton}
                    onLoginClick={() => {
                        if (auth.user) {
                            router.visit('/admin');
                            return;
                        }

                        setShowLogin(true);
                    }}
                    onReturnToScanner={administration.returnToScanner}
                />
            </main>
        </ToastProvider>
    );
}
