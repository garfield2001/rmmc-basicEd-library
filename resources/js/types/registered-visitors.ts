export interface LibraryMemberRow {
    id: number;
    rfid_uid: string | null;
    school_id: string | null;
    type: 'student' | 'employee';
    first_name: string;
    middle_name: string | null;
    last_name: string;
    name: string;
    photo: string | null;
    photo_url: string | null;
    group: string | null;
    duplicate_count: number;
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

export interface LibraryMemberImportPreviewMember {
    status: 'create' | 'rfid';
    type: 'student' | 'employee';
    name: string;
    matched_name: string | null;
    school_id: string | null;
    rfid_uid: string | null;
    year_level: string | null;
    section: string | null;
    department: string | null;
}

export interface LibraryMemberImportSkippedRow {
    name: string;
    type: 'student' | 'employee';
    school_id: string | null;
    rfid_uid: string | null;
    year_level: string | null;
    section: string | null;
    department: string | null;
    reason: string;
}

export interface LibraryMemberImportSummary {
    created: number;
    updated: number;
    restored: number;
    visits: number;
    skipped: number;
    skipped_rows: LibraryMemberImportSkippedRow[];
}

export interface LibraryMemberImportPreview {
    file_name: string;
    total_rows: number;
    importable_count: number;
    skipped_count: number;
    create_count: number;
    update_count: number;
    members: LibraryMemberImportPreviewMember[];
    skipped: LibraryMemberImportSkippedRow[];
}
