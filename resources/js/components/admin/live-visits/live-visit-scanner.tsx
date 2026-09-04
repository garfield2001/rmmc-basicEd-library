import { Button } from '@/components/ui/button';
import { ScanLookupInput, type ScanLookupOption } from '@/components/visits/scan-lookup-input';
import { RadioTower, ScanLine } from 'lucide-react';
import type { FormEventHandler, RefObject } from 'react';

interface LiveVisitScannerProps {
    value: string;
    options: ScanLookupOption[];
    inputRef: RefObject<HTMLInputElement | null>;
    processing: boolean;
    loadingOptions?: boolean;
    error?: string;
    onChange: (value: string) => void;
    onSubmit: FormEventHandler;
}

export function LiveVisitScanner({ value, options, inputRef, processing, loadingOptions = false, error, onChange, onSubmit }: LiveVisitScannerProps) {
    return (
        <div className="admin-surface flex h-full flex-col justify-between rounded-xl border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
                <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/25 dark:bg-blue-600">
                        <RadioTower className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold tracking-wide text-[#030A8C] uppercase dark:text-sky-300">RFID Scanner Terminal</p>
                        <h2 className="text-xl font-extrabold tracking-tight text-[#010440] sm:text-2xl dark:text-white">Record a library visit</h2>
                    </div>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Tap physical RFID card or search by visitor name / school ID to register instantaneous entry.
                </p>
            </div>

            <form onSubmit={onSubmit} className="mt-5 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <ScanLookupInput
                        id="admin-scan-lookup"
                        ref={inputRef}
                        value={value}
                        options={options}
                        loading={loadingOptions}
                        onChange={onChange}
                        placeholder="Scan card or type name / school ID"
                        className="w-full"
                    />
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-11 shrink-0 bg-[#040DBF] px-5 font-semibold text-white shadow-sm transition hover:bg-[#030A8C] active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        <ScanLine className="size-4" />
                        {processing ? 'Recording...' : 'Record visit'}
                    </Button>
                </div>
                {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                        {error}
                    </p>
                )}
            </form>
        </div>
    );
}
