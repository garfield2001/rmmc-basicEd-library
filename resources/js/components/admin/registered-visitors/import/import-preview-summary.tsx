import type { LibraryMemberImportPreview } from '@/types/registered-visitors';
import { AlertTriangle } from 'lucide-react';

export function ImportPreviewSummary({ preview }: { preview: LibraryMemberImportPreview }) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <p className="text-sm font-semibold text-[#010440]">{preview.file_name}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <ImportStat label="Rows read" value={preview.total_rows} />
                <ImportStat label="Ready" value={preview.importable_count} />
                <ImportStat label="New" value={preview.create_count} />
                <ImportStat label="RFID fills" value={preview.update_count} />
            </div>
            <div className="mt-3 space-y-1 text-sm">
                {preview.importable_count === 0 && preview.skipped_count > 0 && (
                    <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 font-medium text-red-700">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                            This file cannot be imported because none of its rows are safe to save. Review the skipped row preview below for the exact
                            issue.
                        </p>
                    </div>
                )}
                {preview.skipped_count > 0 && preview.importable_count > 0 && (
                    <p className="font-medium text-amber-700">
                        {preview.skipped_count} row{preview.skipped_count === 1 ? '' : 's'} will be skipped because required import data is missing,
                        invalid, or already registered.
                    </p>
                )}
            </div>
        </div>
    );
}

function ImportStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg bg-white px-3 py-2">
            <p className="text-xs font-medium text-[#020659]/65">{label}</p>
            <p className="mt-1 text-xl font-semibold text-[#010440]">{value}</p>
        </div>
    );
}
