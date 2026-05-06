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
        start_date: string;
        end_date: string;
        member_type: string | null;
    };
    summary: {
        total: number;
        students: number;
        employees: number;
    };
    rows: VisitReportRow[];
}
