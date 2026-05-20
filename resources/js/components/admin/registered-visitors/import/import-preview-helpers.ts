import type { LibraryMemberImportPreviewMember } from '@/types/registered-visitors';
import type { ImportPreviewSort } from './import-preview-types';

export function importSearchValue(member: LibraryMemberImportPreviewMember): string {
    return [
        member.name,
        member.matched_name,
        member.school_id,
        member.rfid_uid,
        member.type,
        member.year_level,
        member.section,
        member.department,
        member.status,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

export function importSortValue(member: LibraryMemberImportPreviewMember, column: ImportPreviewSort): string {
    if (column === 'year_level') {
        return member.type === 'student' ? (member.year_level ?? '') : (member.department ?? '');
    }

    return String(member[column] ?? '');
}

export function compareImportValues(first: string, second: string): number {
    return first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });
}
