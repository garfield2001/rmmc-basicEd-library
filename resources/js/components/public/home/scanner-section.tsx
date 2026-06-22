import { RMMC_LOGO_PATH } from '@/components/public/home/constants';
import { Button } from '@/components/ui/button';
import { LogIn, RadioTower } from 'lucide-react';
import type { FormEventHandler, RefObject } from 'react';
import { PublicRMMCLogo } from './public-rmmc-logo';
import type { ScanForm } from './types';

interface ScannerSectionProps {
    schoolName: string;
    data: ScanForm;
    inputRef: RefObject<HTMLInputElement | null>;
    isAdministrationRevealed: boolean;
    isScannerReady: boolean;
    isScannerPreparing: boolean;
    isScannerSubmitting: boolean;
    statusText: string;
    instructionText: string;
    formattedManilaTime: string;
    onScanChange: (RFIDUid: string) => void;
    onSubmit: FormEventHandler;
    onAdminClick: () => void;
}

export function ScannerSection({
    schoolName,
    data,
    inputRef,
    isAdministrationRevealed,
    isScannerReady,
    isScannerPreparing,
    isScannerSubmitting,
    statusText,
    instructionText,
    formattedManilaTime,
    onScanChange,
    onSubmit,
    onAdminClick,
}: ScannerSectionProps) {
    return (
        <section
            className={`sticky top-0 isolate z-0 flex min-h-[100svh] items-start overflow-hidden px-5 py-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:items-center sm:px-8 sm:py-10 2xl:px-12 2xl:py-12 ${
                isAdministrationRevealed ? 'scale-[0.98] opacity-0' : 'scale-100 opacity-100'
            }`}
        >
            <img
                src={RMMC_LOGO_PATH}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-[56%] left-1/2 -z-10 h-[68vmin] max-h-[1100px] min-h-[260px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.08] saturate-125 sm:top-1/2 sm:h-[76vmin] sm:min-h-[420px] sm:opacity-[0.11]"
            />
            <div className="public-display-shell mx-auto grid gap-6 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,34vw)] lg:items-center lg:gap-14 2xl:gap-20">
                <div className="min-w-0">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <PublicRMMCLogo />
                        <div className="min-w-0">
                            <p className="public-display-school max-w-4xl font-semibold tracking-tight text-slate-900">{schoolName}</p>
                            <p className="public-display-label mt-1 text-slate-500">Library attendance station</p>
                        </div>
                    </div>

                    <div className="mt-8 max-w-5xl sm:mt-14 2xl:mt-18">
                        <h1 className="public-display-title font-semibold tracking-tight text-slate-900">
                            <span className="hidden sm:inline">Scan your library ID</span>
                            <span className="sm:hidden">Library station</span>
                        </h1>
                        <p className="public-display-copy mt-4 max-w-4xl font-normal text-slate-500 sm:mt-8">
                            <span className="hidden sm:inline">
                                Approved or not, the scan result will appear clearly on this screen after every scan.
                            </span>
                            <span className="sm:hidden">
                                RFID scanning is intended for the library computer. Admin/Staff can sign in from this phone to manage records.
                            </span>
                        </p>
                    </div>

                    <div className="public-mobile-station-card mt-7 rounded-xl border border-[#040DBF]/15 bg-white/88 p-4 shadow-xl shadow-[#010440]/8 sm:hidden">
                        <div className="flex items-center gap-3">
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#040DBF]/10 text-[#040DBF]">
                                <RadioTower className="size-6" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-lg font-semibold text-[#010440]">{statusText}</p>
                                <p className="mt-1 text-sm leading-5 text-[#020659]/75">{formattedManilaTime}</p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={onAdminClick}
                            className="mt-4 h-11 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-95"
                        >
                            <LogIn className="size-4" />
                            Admin login
                        </Button>
                    </div>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="public-scanner-panel relative hidden flex-col items-center justify-center rounded-3xl border border-white/60 bg-white/40 p-8 text-center shadow-2xl shadow-blue-500/10 backdrop-blur-xl sm:flex sm:py-12 2xl:py-16"
                >
                    <input
                        id="public-rfid-scan"
                        ref={inputRef}
                        data-rfid-scan-input="true"
                        value={data.rfid_uid}
                        onChange={(event) => onScanChange(event.target.value)}
                        className="sr-only"
                        autoComplete="off"
                        inputMode="numeric"
                        autoFocus
                        aria-label="RFID scanner input"
                    />

                    <div
                        className={`public-scanner-icon relative flex items-center justify-center rounded-full border bg-white/95 shadow-2xl ring-8 transition-all duration-300 ${
                            isScannerReady
                                ? 'public-scanner-icon-ready border-[#040DBF]/25 text-[#040DBF] shadow-[#040DBF]/15 ring-[#040DBF]/5'
                                : isScannerSubmitting
                                  ? 'public-scanner-icon-recording border-[#030A8C]/30 text-[#030A8C] shadow-[#030A8C]/15 ring-[#030A8C]/10'
                                  : isScannerPreparing
                                    ? 'public-scanner-icon-preparing border-amber-500/35 text-amber-600 shadow-amber-500/15 ring-amber-500/10'
                                    : 'public-scanner-icon-preparing border-red-500/30 text-red-600 shadow-red-500/15 ring-red-500/10'
                        }`}
                    >
                        {isScannerReady && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20"></span>}
                        <RadioTower className="relative z-10" />
                    </div>
                    <div className="mt-7 flex items-center justify-center gap-3 sm:mt-8">
                        {isScannerReady && (
                            <span className="relative flex size-3">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
                            </span>
                        )}
                        <p className="public-scanner-status font-semibold tracking-tight text-slate-900">{statusText}</p>
                    </div>
                    <p className="public-display-copy mt-3 max-w-2xl font-normal text-slate-500 sm:mt-4">{instructionText}</p>
                    <p className="public-scanner-time mt-7 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 font-medium text-slate-700 shadow-sm sm:mt-8 sm:px-5 sm:py-3">
                        {formattedManilaTime}
                    </p>
                </form>
            </div>
        </section>
    );
}
