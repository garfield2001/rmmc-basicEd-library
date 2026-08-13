import type { ChartPoint, EmployeeActivityVisit, StudentActivityVisit } from '@/types/dashboard';
import { BriefcaseBusiness, GraduationCap, type LucideIcon } from 'lucide-react';

interface ActivitySegment {
    key: string;
    label: string;
    value: number;
    color: string;
}

export interface ActivityChartPoint extends ChartPoint {
    segments?: ActivitySegment[];
    [key: string]: string | number | ActivitySegment[] | undefined;
}

export type ActivityPanel = 'yearLevel' | 'department';

export const activityDefaultLimit = 5;
export const activityPanelOrder: ActivityPanel[] = ['yearLevel', 'department'];

const sectionPalette = ['#2563eb', '#16a34a', '#9333ea', '#f59e0b', '#dc2626', '#0891b2', '#db2777', '#65a30d', '#4f46e5', '#ea580c'];

export const activityPanelDetails = {
    yearLevel: {
        title: 'Year Level Activity',
        detail: 'unique students, stacked by section',
        label: 'Year level',
        icon: GraduationCap,
        emptyMessage: 'Student visits by year level will appear after scanning.',
        labelWidth: 150,
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

export function groupStudentActivityByYearLevel(visits: StudentActivityVisit[], yearLevelLabels: string[]): ActivityChartPoint[] {
    const yearGroups = new Map<string, Map<string, Set<number>>>();
    const sectionLabels = new Set<string>();

    yearLevelLabels.forEach((label) => yearGroups.set(label, new Map()));

    visits.forEach((visit) => {
        const yearLevel = visit.yearLevel || 'Unassigned';
        const section = visit.section || 'Unassigned';
        const sections = yearGroups.get(yearLevel) ?? new Map<string, Set<number>>();
        const visitors = sections.get(section) ?? new Set<number>();

        visitors.add(visit.visitorId);
        sections.set(section, visitors);
        sectionLabels.add(section);
        yearGroups.set(yearLevel, sections);
    });

    const sectionColorMap = [...sectionLabels].sort(sortLabel).reduce<Map<string, string>>((colors, section, index) => {
        colors.set(section, sectionPalette[index % sectionPalette.length]);

        return colors;
    }, new Map());

    return [...yearGroups.entries()]
        .map(([label, sections]) => {
            const segments = [...sections.entries()]
                .sort(([first], [second]) => sortLabel(first, second))
                .map(([section, visitorsSet]) => ({
                    key: `section_${slugify(section)}`,
                    label: section,
                    value: visitorsSet.size,
                    color: sectionColorMap.get(section) ?? sectionPalette[0],
                }));
            const value = segments.reduce((sum, segment) => sum + segment.value, 0);
            const point: ActivityChartPoint = { label, value, segments };

            segments.forEach((segment) => {
                point[segment.key] = segment.value;
            });

            return point;
        })
        .sort((first, second) => second.value - first.value);
}

export function groupEmployeeActivity(visits: EmployeeActivityVisit[], labels: string[]): ActivityChartPoint[] {
    const groups = new Map<string, Set<number>>(labels.map((label) => [label, new Set()]));

    visits.forEach((visit) => {
        const label = visit.department || 'Unassigned';
        const visitors = groups.get(label) ?? new Set<number>();
        visitors.add(visit.visitorId);
        groups.set(label, visitors);
    });

    return chartPoints(groups).map((point) => ({ ...point }));
}

function chartPoints(groups: Map<string, Set<number>>) {
    return [...groups.entries()].map(([label, visitors]) => ({ label, value: visitors.size })).sort((first, second) => second.value - first.value);
}

function slugify(value: string) {
    return (
        value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '') || 'unassigned'
    );
}

function sortLabel(first: string, second: string) {
    return first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' });
}
