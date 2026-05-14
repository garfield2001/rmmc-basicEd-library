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
    RFIDUid: string;
    schoolId: string;
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
    label: string;
    students: number;
    employees: number;
    total: number;
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
        studentRegistrations: number;
        visitsToday: number;
        employeeVisitors: number;
    };
    visitorBreakdown: {
        students: number;
        employees: number;
    };
    charts: {
        visitsByDay: VisitTrendPoint[];
        studentVisitsByYearLevel: ChartPoint[];
        studentVisitsBySection: ChartPoint[];
        requiredProgress: RequiredProgressPoint[];
    };
}

export interface AdminVisitMonitor {
    metrics: {
        visitsToday: number;
        studentVisitsToday: number;
        employeeVisitsToday: number;
    };
    todayVisits: DashboardVisit[];
    scanTargets: ScanTarget[];
}
