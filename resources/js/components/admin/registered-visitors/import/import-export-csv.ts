import type { LibraryMemberImportSkippedRow } from '@/types/registered-visitors';

function escapeCsv(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return '""';
    }
    const str = String(value);
    return `"${str.replace(/"/g, '""')}"`;
}

export function exportSkippedRowsToCsv(skippedRows: LibraryMemberImportSkippedRow[], baseFileName?: string): void {
    if (!skippedRows || skippedRows.length === 0) {
        return;
    }

    const headers = ['Name', 'Type', 'Provided School ID', 'RFID UID', 'Year Level', 'Section', 'Department', 'Reason / Diagnostic'];
    const rows = skippedRows.map((row) => [
        escapeCsv(row.name),
        escapeCsv(row.type),
        escapeCsv(row.school_id),
        escapeCsv(row.rfid_uid),
        escapeCsv(row.year_level),
        escapeCsv(row.section),
        escapeCsv(row.department),
        escapeCsv(row.reason),
    ]);

    const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanPrefix = baseFileName ? baseFileName.replace(/\.[^/.]+$/, '') : 'import';
    const fileName = `${cleanPrefix}-unimported-${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
