import { formatDisplayDate } from '@/components/ui/date-input';
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

export function filterStudentActivityVisits(visits: StudentActivityVisit[], days: number, fromDate: string) {
    const [from, to] = activityDateRange(days, fromDate);

    return visits.filter((visit) => visit.visitedAt && (!from || visit.visitedAt >= from) && visit.visitedAt <= to);
}

export function filterEmployeeActivityVisits(visits: EmployeeActivityVisit[], days: number, fromDate: string) {
    const [from, to] = activityDateRange(days, fromDate);

    return visits.filter((visit) => visit.visitedAt && (!from || visit.visitedAt >= from) && visit.visitedAt <= to);
}

export function activityRangeDetail(days: number, fromDate: string) {
    return fromDate ? `Visits from ${formatDisplayDate(fromDate)} to today` : `Visits from the last ${days} days`;
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

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

function activityDateRange(days: number, fromDate: string): [string, string] {
    if (fromDate) {
        return [fromDate, todayIsoDate()];
    }

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (Math.max(1, days) - 1));

    return [start.toISOString().slice(0, 10), todayIsoDate()];
}
