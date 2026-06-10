import type { ChartPoint, EmployeeActivityVisit, StudentActivityVisit } from '@/types/dashboard';
import { BriefcaseBusiness, GraduationCap, Target, type LucideIcon } from 'lucide-react';

export type ActivityPanel = 'yearLevel' | 'section' | 'department';

export const activityDefaultLimit = 5;
export const activityPanelOrder: ActivityPanel[] = ['yearLevel', 'section', 'department'];

export const activityPanelDetails = {
    yearLevel: {
        title: 'Year Level Activity',
        detail: 'student year level',
        label: 'Year level',
        icon: GraduationCap,
        emptyMessage: 'Student visits by year level will appear after scanning.',
        labelWidth: 150,
    },
    section: {
        title: 'Section Activity',
        detail: 'section',
        label: 'Section',
        icon: Target,
        emptyMessage: 'Section-level visit trends will appear after scanning students.',
        labelWidth: 240,
    },
    department: {
        title: 'Department Activity',
        detail: 'employee department',
        label: 'Department',
        icon: BriefcaseBusiness,
        emptyMessage: 'Department-level visit trends will appear after scanning employees.',
        labelWidth: 280,
    },
} satisfies Record<ActivityPanel, { title: string; detail: string; label: string; icon: LucideIcon; emptyMessage: string; labelWidth: number }>;

export function filterStudentActivityVisits(visits: StudentActivityVisit[], startDate: string, endDate: string) {
    return visits.filter((visit) => visit.visitedAt && (!startDate || visit.visitedAt >= startDate) && (!endDate || visit.visitedAt <= endDate));
}

export function filterEmployeeActivityVisits(visits: EmployeeActivityVisit[], startDate: string, endDate: string) {
    return visits.filter((visit) => visit.visitedAt && (!startDate || visit.visitedAt >= startDate) && (!endDate || visit.visitedAt <= endDate));
}

export function groupStudentActivity(visits: StudentActivityVisit[], mode: 'yearLevel' | 'section', labels: string[]): ChartPoint[] {
    const groups = countByLabel(labels);

    visits.forEach((visit) => {
        const label =
            mode === 'yearLevel' ? visit.yearLevel || 'Unassigned' : [visit.yearLevel, visit.section].filter(Boolean).join(' - ') || 'Unassigned';

        groups.set(label, (groups.get(label) ?? 0) + 1);
    });

    return chartPoints(groups);
}

export function groupEmployeeActivity(visits: EmployeeActivityVisit[], labels: string[]): ChartPoint[] {
    const groups = countByLabel(labels);

    visits.forEach((visit) => {
        const label = visit.department || 'Unassigned';
        groups.set(label, (groups.get(label) ?? 0) + 1);
    });

    return chartPoints(groups);
}

function countByLabel(labels: string[]) {
    return new Map(labels.map((label) => [label, 0]));
}

function chartPoints(groups: Map<string, number>) {
    return [...groups.entries()].map(([label, value]) => ({ label, value })).sort((first, second) => second.value - first.value);
}
