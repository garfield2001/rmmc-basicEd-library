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

export interface AdminDashboard {
    scanWindow: {
        starts_at: string;
        ends_at: string;
    };
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

export interface AdminVisitHistory {
    schoolYear:
        | {
              id: number;
              name: string;
              starts_at: string;
              ends_at: string;
          }
        | null;
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
    visitors: VisitHistoryVisitor[];
}

export interface VisitHistoryVisit {
    id: number;
    visitedAt: string | null;
}

export interface VisitHistoryVisitor {
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
    visits: VisitHistoryVisit[];
}
