export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface SchoolYearSummary {
    id: number;
    name: string;
}

export interface DashboardVisit {
    id: number;
    visitedAt: string | null;
    member: {
        schoolId: string | null;
        name: string | null;
        type: 'student' | 'employee' | null;
        yearLevel: string | null;
        section: string | null;
        department: string | null;
        photoUrl: string | null;
    };
}

export interface ScanTarget {
    id: number;
    rfidUid: string;
    schoolId: string;
    name: string;
    firstName: string;
    lastName: string;
    type: 'student' | 'employee';
    detail: string | null;
}

export interface PublicDashboard {
    schoolYear:
        | (SchoolYearSummary & {
              minimum_visits?: number;
              target_visits?: number;
          })
        | null;
    metrics: {
        students: number;
        employees: number;
        visitsToday: number;
        studentVisitsToday: number;
        employeeVisitsToday: number;
        visitsThisSchoolYear: number;
    };
    todayVisits: DashboardVisit[];
    scanTargets: ScanTarget[];
}

export interface AdminDashboard {
    schoolYear: PublicDashboard['schoolYear'];
    metrics: {
        activeMembers: number;
        inactiveMembers: number;
        visitsToday: number;
        visitsThisSchoolYear: number;
    };
    memberBreakdown: {
        students: number;
        employees: number;
    };
    charts: {
        visitsByDay: ChartPoint[];
        visitsByType: ChartPoint[];
        studentVisitsByYearLevel: ChartPoint[];
    };
}

export interface ChartPoint {
    label: string;
    value: number;
}

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

export interface Paginated<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    meta?: {
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
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

export interface SharedData {
    name: string;
    schoolYear: SchoolYearSummary | null;
    auth: {
        user: AuthUser | null;
    };
    flash: {
        success?: string;
        recentVisit?: DashboardVisit | null;
    };
    [key: string]: unknown;
}
