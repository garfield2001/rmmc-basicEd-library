export interface RegisteredVisitorRow {
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
    deleted_at: string | null;
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
    targetSection: string | null;
    visitorIds: number[];
    matchedStudents: {
        id: number;
        schoolId: string;
        name: string;
        currentYearLevel: string | null;
        currentSection: string | null;
    }[];
    notFoundIds: string[];
    duplicateIds: string[];
    incompleteDetailIds: string[];
}
