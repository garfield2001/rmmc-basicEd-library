export interface LibraryMemberRow {
    id: number;
    rfid_uid: string;
    school_id: string;
    type: 'student' | 'employee';
    first_name: string;
    middle_name: string | null;
    last_name: string;
    name: string;
    photo: string | null;
    photo_url: string | null;
    is_active: boolean;
    group: string | null;
    student: {
        year_level: string;
        section: string;
    } | null;
    employee: {
        department: string;
    } | null;
}
