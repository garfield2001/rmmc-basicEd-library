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
        school_year_id: number;
        school_year_section_id: number | null;
        year_level: string;
        section: string | null;
        status: 'enrolled' | 'pending' | 'retained' | 'not_enrolled' | 'stopped' | 'transferred' | 'graduated';
    } | null;
    source_student?: LibraryMemberRow['student'];
    target_student?: LibraryMemberRow['student'];
    employee: {
        department: string;
    } | null;
}
