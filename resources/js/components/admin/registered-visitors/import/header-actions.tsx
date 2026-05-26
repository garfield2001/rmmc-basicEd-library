import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import type React from 'react';

export function RegisteredVisitorsHeaderActions({
    importing,
    importInputRef,
    createLabel = 'Add visitor',
    onImportFile,
    onCreateVisitor,
}: {
    importing: boolean;
    importInputRef: React.RefObject<HTMLInputElement | null>;
    createLabel?: string;
    onImportFile: (file: File | null) => void;
    onCreateVisitor: () => void;
}) {
    return (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <input
                ref={importInputRef}
                type="file"
                accept=".csv,.txt,.tsv,.xls,.xlsx,.xlsm,.docx,.pdf"
                className="hidden"
                onChange={(event) => onImportFile(event.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} disabled={importing} className="w-full sm:w-auto">
                <Upload className="size-4" />
                {importing ? 'Importing...' : 'Import'}
            </Button>
            <Button type="button" onClick={onCreateVisitor} className="w-full sm:w-auto">
                <Plus className="size-4" />
                {createLabel}
            </Button>
        </div>
    );
}
