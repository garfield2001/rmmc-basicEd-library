import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LibraryMemberImportSummary } from '@/types/registered-visitors';
import { CheckCircle2, UserCheck, Users, XCircle } from 'lucide-react';
import { ImportSkippedTable } from './import-skipped-table';

interface ImportResultDialogProps {
    open: boolean;
    summary: LibraryMemberImportSummary | null;
    onClose: () => void;
}

export function ImportResultDialog({ open, summary, onClose }: ImportResultDialogProps) {
    if (!summary) {
        return null;
    }

    const hasSkipped = (summary.skipped ?? 0) > 0 || (summary.skipped_rows?.length ?? 0) > 0;
    const skippedRows = summary.skipped_rows ?? [];

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent
                className="top-6 max-h-[calc(100dvh-3rem)] ![translate:-50%_0] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-4xl"
            >
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-6 text-emerald-600 shrink-0" />
                        <DialogTitle className="text-2xl text-[#010440]">Import Finished</DialogTitle>
                    </div>
                    <DialogDescription>
                        Summary of imported records and any unimported rows requiring correction.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 space-y-4 overflow-y-auto pr-1 pb-2">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                                <Users className="size-3.5" />
                                <span>Newly Registered</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold text-emerald-950">{summary.created}</p>
                        </div>

                        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-800">
                                <UserCheck className="size-3.5" />
                                <span>RFID Updated</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold text-blue-950">{summary.updated}</p>
                        </div>

                        <div
                            className={`col-span-2 rounded-lg border p-3 sm:col-span-1 ${
                                hasSkipped
                                    ? 'border-amber-200 bg-amber-50 text-amber-950'
                                    : 'border-zinc-100 bg-zinc-50 text-zinc-800'
                            }`}
                        >
                            <div
                                className={`flex items-center gap-1.5 text-xs font-medium ${
                                    hasSkipped ? 'text-amber-800' : 'text-zinc-600'
                                }`}
                            >
                                <XCircle className="size-3.5" />
                                <span>Skipped / Unimported</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold">{summary.skipped}</p>
                        </div>
                    </div>

                    {!hasSkipped && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            Great! All records in your import file were validated and processed successfully with no errors or skipped rows.
                        </div>
                    )}

                    {hasSkipped && (
                        <ImportSkippedTable
                            rows={skippedRows}
                            title="Unimported Records Diagnostic"
                            description="The following records could not be imported. Please review the provided School IDs and diagnostics below, or export the list to fix them."
                        />
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" onClick={onClose} className="bg-[#040DBF] hover:bg-[#030AA6] text-white">
                        Close Summary
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
