export interface VisitReportRow {
    id: number;
    school_id: string | null;
    name: string | null;
    type: string | null;
    status: string;
    department: string | null;
    year_level: string | null;
    section: string | null;
    visit_count: number;
    minimum_met: boolean;
    target_met: boolean;
    progress_percent: number;
    last_visit_at: string | null;
}

export interface VisitReportSchoolYear {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string;
    minimum_visits: number;
    target_visits: number;
    is_active: boolean;
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
    school_year: VisitReportSchoolYear | null;
    summary: {
        member_type: string;
        members: number;
        total_visits: number;
        visited_members: number;
        unvisited_members: number;
        met_minimum: number;
        met_target: number;
        average_visits: number;
        minimum_visits: number;
        target_visits: number;
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
