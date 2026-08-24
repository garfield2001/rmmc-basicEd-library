import type { VisitReportRow } from '@/types/reports';

export type StudentFilterStatus = 'all' | 'met' | 'in_progress' | 'zero';
export type DepartmentTab = 'all' | 'preschool' | 'elementary' | 'jhs';
export type SectionSortMode = 'visits_desc' | 'grade_asc' | 'completion_desc' | 'completion_asc';

export interface SectionAggregate {
    key: string;
    label: string;
    yearLevel: string;
    sectionName: string;
    department: 'preschool' | 'elementary' | 'jhs';
    totalVisits: number;
    studentCount: number;
    averageVisits: number;
    metRequiredCount: number;
    completionPercent: number;
    students: VisitReportRow[];
    topStudent: VisitReportRow | null;
}
