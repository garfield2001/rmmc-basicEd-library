import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Info, Timer } from 'lucide-react';
import { getRestrictedRescanDetails } from './helpers';

interface ScanErrorDialogProps {
    open: boolean;
    error?: string;
    countdown: number;
    onOpenChange: (open: boolean) => void;
}

export function ScanErrorDialog({ open, error, countdown, onOpenChange }: ScanErrorDialogProps) {
    const isRestrictedRescan = error?.toLowerCase().includes('repeat scans are limited') ?? false;
    const { recentScanTime, allowedRescanTime } = getRestrictedRescanDetails(error);
    const ScanErrorIcon = isRestrictedRescan ? Info : AlertTriangle;

    return (
        <Dialog open={open && Boolean(error)} onOpenChange={onOpenChange}>
            <DialogContent className="min-h-135 overflow-hidden p-0 sm:max-w-5xl">
                <div className={`h-3 ${isRestrictedRescan ? 'bg-[#040DBF]' : 'bg-red-600'}`} />
                <div className="flex min-h-134.25 flex-col justify-center p-6 text-center sm:p-10">
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
                        <DialogDescription className="sr-only">
                            {isRestrictedRescan
                                ? 'This member has already scanned recently and must wait before scanning again.'
                                : 'The scanned card or ID could not be matched to an active registered visitor.'}
                        </DialogDescription>
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
                                    <p className="mt-2 text-6xl leading-none font-semibold tracking-normal text-[#040DBF]">{countdown}</p>
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
                                <p className="mt-2 text-5xl font-semibold tracking-normal">Unknown ID</p>
                            </div>
                            <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-red-700 uppercase">
                                    <Timer className="size-4" />
                                    Closes in
                                </div>
                                <p className="mt-2 text-6xl leading-none font-semibold tracking-normal text-red-600">{countdown}</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
