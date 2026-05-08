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
        <section className="grid gap-4">
            <form onSubmit={onSubmit} className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/25">
                            <RadioTower className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[#030A8C]">RFID scanner</p>
                            <h2 className="text-xl font-semibold tracking-normal text-[#010440]">Record a library visit</h2>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-xl">
                        <ScanLookupInput
                            id="admin-scan-lookup"
                            ref={inputRef}
                            value={value}
                            options={options}
                            loading={loadingOptions}
                            onChange={onChange}
                            placeholder="Scan card or type name / school ID"
                            className="w-full"
                            autoFocus
                        />
                        <Button type="submit" disabled={processing} className="h-11 shrink-0 bg-[#040DBF] px-5 text-white hover:bg-[#030A8C]">
                            <ScanLine className="size-4" />
                            {processing ? 'Recording...' : 'Record visit'}
                        </Button>
                    </div>
                </div>
                {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            </form>
        </section>
    );
}
