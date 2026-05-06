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
            className={`sticky top-0 isolate z-0 flex min-h-screen items-center overflow-hidden px-5 py-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-8 sm:py-10 ${
                isAdministrationRevealed ? 'scale-[0.98] opacity-0' : 'scale-100 opacity-100'
            }`}
        >
            <img
                src={RMMC_LOGO_PATH}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[76vmin] max-h-[820px] min-h-[420px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.11] saturate-125"
            />
            <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-center lg:gap-14">
                <div className="min-w-0">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <PublicRMMCLogo />
                        <div className="min-w-0">
                            <p className="max-w-xl text-lg leading-6 font-semibold text-[#010440] sm:text-2xl sm:leading-8">{schoolName}</p>
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
                    onSubmit={onSubmit}
                    className="relative flex min-h-[300px] flex-col items-center justify-center border-y border-[#040DBF]/15 py-8 text-center sm:min-h-[380px] sm:py-10 lg:min-h-[460px]"
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
                        className={`flex size-32 items-center justify-center rounded-full border bg-white/95 shadow-2xl ring-8 transition-colors duration-300 sm:size-40 ${
                            isScannerReady
                                ? 'border-[#040DBF]/25 text-[#040DBF] shadow-[#040DBF]/15 ring-[#040DBF]/5'
                                : 'border-red-500/30 text-red-600 shadow-red-500/15 ring-red-500/10'
                        }`}
                    >
                        <RadioTower className="size-14 sm:size-18" />
                    </div>
                    <p className="mt-7 text-3xl font-semibold tracking-normal text-[#010440] sm:mt-8 sm:text-5xl">{statusText}</p>
                    <p className="mt-3 max-w-md text-lg leading-7 text-[#020659] sm:mt-4 sm:text-2xl sm:leading-9">{instructionText}</p>
                    <p className="mt-7 rounded-lg border border-[#030A8C]/15 bg-white/90 px-4 py-2.5 text-base font-medium text-[#010440] shadow-sm shadow-[#010440]/5 sm:mt-8 sm:px-5 sm:py-3 sm:text-xl">
                        {formattedManilaTime}
                    </p>
                </form>
            </div>
        </section>
    );
}
