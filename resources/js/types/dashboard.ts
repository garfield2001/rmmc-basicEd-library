import type { SchoolYearSummary } from './school-year';

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

export interface AdminDashboard {
    schoolYear:
        | (SchoolYearSummary & {
              minimum_visits?: number;
              target_visits?: number;
          })
        | null;
    metrics: {
        activeMembers: number;
        enrolledStudents: number;
        visitsToday: number;
        employeeMembers: number;
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

export interface AdminVisitMonitor {
    metrics: {
        visitsToday: number;
        studentVisitsToday: number;
        employeeVisitsToday: number;
    };
    todayVisits: DashboardVisit[];
    scanTargets: ScanTarget[];
}
