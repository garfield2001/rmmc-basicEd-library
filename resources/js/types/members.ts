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
    } | null;
    employee: {
        department: string;
    } | null;
}

export interface StudentAssignmentPreview {
    inputCount: number;
    uniqueCount: number;
    matchedCount: number;
    yearLevel: string;
    section: string | null;
    memberIds: number[];
    matchedStudents: {
        id: number;
        schoolId: string;
        name: string;
        currentYearLevel: string | null;
        currentSection: string | null;
    }[];
    notFoundIds: string[];
    duplicateIds: string[];
}
