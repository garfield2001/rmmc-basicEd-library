import type { SchoolYearSummary } from './school-year';

export interface DashboardVisit {
    id: number;
    visitedAt: string | null;
    visitor: {
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
    RFIDUid: string | null;
    schoolId: string | null;
    name: string;
    firstName: string;
    lastName: string;
    type: 'student' | 'employee';
    detail: string | null;
}

export interface ChartPoint {
    label: string;
    value: number;
}

export interface VisitTrendPoint {
    date?: string;
    label: string;
    students: number;
    employees: number;
    total: number;
}

export type VisitTrafficRange = 'last7' | 'last14' | 'lastMonth' | 'custom';

export interface StudentActivityVisit {
    visitedAt: string | null;
    yearLevel: string | null;
    section: string | null;
}

export interface EmployeeActivityVisit {
    visitedAt: string | null;
    department: string | null;
}

export interface RequiredProgressPoint {
    label: 'Students' | 'Employees';
    required: number;
    visitors: number;
    visits: number;
    required_total: number;
    met_required: number;
    percent: number;
}

export interface IndividualProgressPoint {
    id: number;
    name: string;
    schoolId: string | null;
    type: 'student' | 'employee';
    group: string;
    visits: number;
    required: number;
    remaining: number;
    percent: number;
}

export interface DashboardScanSettings {
    repeat_scan_interval_hours: number;
    repeat_scan_interval_minutes: number;
    scan_starts_at: string;
    scan_ends_at: string;
    success_modal_close_seconds: number;
    error_modal_close_seconds: number;
    scanner_cooldown_seconds: number;
}

export interface AdminDashboard {
    scanWindow: {
        starts_at: string;
        ends_at: string;
    };
    scanSettings: DashboardScanSettings;
    schoolYear:
        | (SchoolYearSummary & {
              starts_at?: string;
              ends_at?: string;
              student_required_visits?: number;
              employee_required_visits?: number;
          })
        | null;
    metrics: {
        registeredVisitors: number;
        studentSchoolYearRecords: number;
        visitsToday: number;
        employeeVisitors: number;
    };
    visitorBreakdown: {
        students: number;
        employees: number;
    };
    charts: {
        visitsByDay: Record<Exclude<VisitTrafficRange, 'custom'>, VisitTrendPoint[]>;
        dailyVisits: VisitTrendPoint[];
        studentActivityVisits: StudentActivityVisit[];
        employeeActivityVisits: EmployeeActivityVisit[];
        activityGroups: {
            yearLevels: string[];
            sections: string[];
            departments: string[];
        };
        studentVisitsByYearLevel: ChartPoint[];
        studentVisitsBySection: ChartPoint[];
        employeeVisitsByDepartment: ChartPoint[];
        requiredProgress: RequiredProgressPoint[];
        individualProgress: IndividualProgressPoint[];
    };
}

export interface AdminVisitMonitor {
    scanWindow: {
        starts_at: string;
        ends_at: string;
    };
    metrics: {
        visitsToday: number;
        studentVisitsToday: number;
        employeeVisitsToday: number;
    };
    todayVisits: DashboardVisit[];
    scanTargets: ScanTarget[];
}

export interface AdminVisitLogs {
    schoolYear: {
        id: number;
        name: string;
        starts_at: string;
        ends_at: string;
        student_required_visits: number;
        employee_required_visits: number;
    } | null;
    metrics: {
        visitors: number;
        studentVisitors: number;
        employeeVisitors: number;
        visits: number;
        studentVisits: number;
        employeeVisits: number;
    };
    filters: {
        yearLevels: string[];
        sectionsByYearLevel: Record<string, string[]>;
        departments: string[];
    };
    visitors: VisitLogVisitor[];
}

export interface VisitLogVisit {
    id: number;
    visitedAt: string | null;
}

export interface VisitLogVisitor {
    id: number;
    schoolId: string | null;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    type: 'student' | 'employee' | null;
    yearLevel: string | null;
    section: string | null;
    department: string | null;
    photoUrl: string | null;
    visits: VisitLogVisit[];
}
