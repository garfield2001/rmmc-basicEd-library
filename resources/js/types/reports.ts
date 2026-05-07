export interface VisitReportRow {
    id: number;
    visited_at: string | null;
    school_year: string | null;
    school_id: string | null;
    name: string | null;
    type: string | null;
    department: string | null;
    year_level: string | null;
    section: string | null;
}

export interface VisitReport {
    filters: {
        school_year_id: number | null;
        start_date: string;
        end_date: string;
        member_type: string | null;
        member_status: string | null;
        year_level: string | null;
        section: string | null;
        department: string | null;
    };
    summary: {
        total: number;
        students: number;
        employees: number;
    };
    rows: VisitReportRow[];
}

export interface VisitReportOptions {
    schoolYears: {
        id: number;
        name: string;
        is_active: boolean;
    }[];
    yearLevels: string[];
    sectionsByYearLevel: Record<string, string[]>;
    sectionsBySchoolYear: Record<string, Record<string, string[]>>;
    departments: string[];
}
