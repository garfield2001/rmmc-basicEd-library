export interface VisitReportRow {
    id: number;
    school_id: string | null;
    name: string | null;
    type: string | null;
    department: string | null;
    year_level: string | null;
    section: string | null;
    visit_count: number;
    required_met: boolean;
    progress_percent: number;
    last_visit_at: string | null;
}

export interface VisitReportSchoolYear {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string;
    student_required_visits: number;
    employee_required_visits: number;
    is_active: boolean;
}

export interface VisitReport {
    filters: {
        school_year_id: number | null;
        start_date: string;
        end_date: string;
        visitor_type: string | null;
        year_level: string | null;
        section: string | null;
        department: string | null;
    };
    school_year: VisitReportSchoolYear | null;
    summary: {
        visitor_type: string;
        visitors: number;
        total_visits: number;
        visited_visitors: number;
        unvisited_visitors: number;
        met_required: number;
        average_visits: number;
        required_visits: number;
        progress_percent: number;
    };
    rows: VisitReportRow[];
}

export interface VisitReportOptions {
    schoolYears: VisitReportSchoolYear[];
    yearLevels: string[];
    sectionsByYearLevel: Record<string, string[]>;
    sectionsBySchoolYear: Record<string, Record<string, string[]>>;
    departments: string[];
}
