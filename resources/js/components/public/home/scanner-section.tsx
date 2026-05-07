import { RMMC_LOGO_PATH } from '@/components/public/home/constants';
import { RadioTower } from 'lucide-react';
import type { FormEventHandler, RefObject } from 'react';
import { PublicRMMCLogo } from './public-rmmc-logo';
import type { ScanForm } from './types';

interface ScannerSectionProps {
    schoolName: string;
    data: ScanForm;
    inputRef: RefObject<HTMLInputElement | null>;
    isAdministrationRevealed: boolean;
    isScannerReady: boolean;
    statusText: string;
    instructionText: string;
    formattedManilaTime: string;
    onScanChange: (RFIDUid: string) => void;
    onSubmit: FormEventHandler;
}

export function ScannerSection({
    schoolName,
    data,
    inputRef,
    isAdministrationRevealed,
    isScannerReady,
    statusText,
    instructionText,
    formattedManilaTime,
    onScanChange,
    onSubmit,
}: ScannerSectionProps) {
    return (
        <section
            className={`sticky top-0 isolate z-0 flex min-h-screen items-center overflow-hidden px-5 py-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-8 sm:py-10 2xl:px-12 2xl:py-12 ${
                isAdministrationRevealed ? 'scale-[0.98] opacity-0' : 'scale-100 opacity-100'
            }`}
        >
            <img
                src={RMMC_LOGO_PATH}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[76vmin] max-h-[1100px] min-h-[420px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.11] saturate-125"
            />
            <div className="public-display-shell mx-auto grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,34vw)] lg:items-center lg:gap-14 2xl:gap-20">
                <div className="min-w-0">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <PublicRMMCLogo />
                        <div className="min-w-0">
                            <p className="public-display-school max-w-4xl font-semibold text-[#010440]">{schoolName}</p>
                            <p className="public-display-label mt-1 text-[#030A8C]">Library attendance station</p>
                        </div>
                    </div>

                    <div className="mt-10 max-w-5xl sm:mt-14 2xl:mt-18">
                        <h1 className="public-display-title font-semibold tracking-normal text-[#010440]">Scan your library ID</h1>
                        <p className="public-display-copy mt-6 max-w-4xl text-[#020659] sm:mt-8">
                            Approved or not, the scan result will appear clearly on this screen after every scan.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="public-scanner-panel relative flex flex-col items-center justify-center border-y border-[#040DBF]/15 py-8 text-center sm:py-10 2xl:py-12"
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
                        className={`public-scanner-icon flex items-center justify-center rounded-full border bg-white/95 shadow-2xl ring-8 transition-colors duration-300 ${
                            isScannerReady
                                ? 'border-[#040DBF]/25 text-[#040DBF] shadow-[#040DBF]/15 ring-[#040DBF]/5'
                                : 'border-red-500/30 text-red-600 shadow-red-500/15 ring-red-500/10'
                        }`}
                    >
                        <RadioTower />
                    </div>
                    <p className="public-scanner-status mt-7 font-semibold tracking-normal text-[#010440] sm:mt-8">{statusText}</p>
                    <p className="public-display-copy mt-3 max-w-2xl text-[#020659] sm:mt-4">{instructionText}</p>
                    <p className="public-scanner-time mt-7 rounded-lg border border-[#030A8C]/15 bg-white/90 px-4 py-2.5 font-medium text-[#010440] shadow-sm shadow-[#010440]/5 sm:mt-8 sm:px-5 sm:py-3">
                        {formattedManilaTime}
                    </p>
                </form>
            </div>
        </section>
    );
}
