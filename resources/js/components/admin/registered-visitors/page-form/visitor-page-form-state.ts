import type { LibraryMemberRow } from '@/types/registered-visitors';

export type VisitorPageFormData = {
    _method: string;
    rfid_uid: string;
    school_id: string;
    type: 'student' | 'employee';
    first_name: string;
    middle_name: string;
    last_name: string;
    photo_file: File | null;
    year_level: string;
    section: string;
    department: string;
};

export const visitorPageInputClass =
    'mt-2 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100';

export function initialVisitorPageFormData(visitor: LibraryMemberRow | null): VisitorPageFormData {
    return {
        _method: visitor ? 'put' : 'post',
        rfid_uid: visitor?.rfid_uid ?? '',
        school_id: visitor?.school_id ?? '',
        type: visitor?.type ?? 'student',
        first_name: visitor?.first_name ?? '',
        middle_name: visitor?.middle_name ?? '',
        last_name: visitor?.last_name ?? '',
        photo_file: null,
        year_level: visitor?.student?.year_level ?? '',
        section: visitor?.student?.section ?? '',
        department: visitor?.employee?.department ?? '',
    };
}
