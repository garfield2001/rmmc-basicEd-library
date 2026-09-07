import type { LibraryMemberImportPreview } from '@/types/registered-visitors';
import { AlertTriangle } from 'lucide-react';

export function ImportPreviewSummary({ preview }: { preview: LibraryMemberImportPreview }) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <p className="text-sm font-semibold text-[#010440]">{preview.file_name}</p>
            <div className={`mt-3 grid gap-3 ${preview.skipped_count > 0 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
                <ImportStat label="Rows read" value={preview.total_rows} />
                <ImportStat label="Ready to import" value={preview.importable_count} />
                <ImportStat label="New members" value={preview.create_count} />
                <ImportStat label="RFID fills" value={preview.update_count} />
                {preview.skipped_count > 0 && (
                    <ImportStat
                        label="Skipped / Attention"
                        value={preview.skipped_count}
                        tone="warning"
                    />
                )}
            </div>
            <p className="mt-3 text-xs leading-5 text-[#020659]/70">
                Only School ID, First Name, Middle Name, Last Name, optional RFID, and visitor group details are used. Existing matching visitors are
                not overwritten; imports only fill a missing RFID when the School ID and name match.
            </p>
            <div className="mt-3 space-y-1 text-sm">
                {preview.importable_count === 0 && preview.skipped_count > 0 && (
                    <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 font-medium text-red-700">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                            This file cannot be imported because none of its rows are safe to save. Review the unimported records below for the exact issue (e.g. incorrect School ID lengths or missing columns).
                        </p>
                    </div>
                )}
                {preview.skipped_count > 0 && preview.importable_count > 0 && (
                    <p className="font-medium text-amber-700">
                        {preview.skipped_count} row{preview.skipped_count === 1 ? '' : 's'} will be skipped because required import data is missing,
                        has invalid School IDs, or conflicts with existing records.
                    </p>
                )}
            </div>
        </div>
    );
}

function ImportStat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warning' }) {
    const toneStyles = tone === 'warning'
        ? 'border border-amber-200 bg-amber-50 text-amber-900'
        : 'bg-white text-[#010440]';

    return (
        <div className={`rounded-lg px-3 py-2 ${toneStyles}`}>
            <p className={`text-xs font-medium ${tone === 'warning' ? 'text-amber-700' : 'text-[#020659]/65'}`}>{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
    );
}
