import type { VisitReportRow } from '@/types/reports';
import { useMemo } from 'react';
import type { SectionAggregate } from './student-section-types';

function inferDepartment(yearLevel: string): 'preschool' | 'elementary' | 'jhs' {
    const l = yearLevel.toLowerCase();
    if (l.includes('kinder')) {
        return 'preschool';
    }
    if (l.includes('grade 7') || l.includes('grade 8') || l.includes('grade 9') || l.includes('grade 10') || l.includes('high')) {
        return 'jhs';
    }
    return 'elementary';
}

export function useStudentSectionAggregates(rows: VisitReportRow[], requiredVisits: number): SectionAggregate[] {
    return useMemo(() => {
        const groups = new Map<string, VisitReportRow[]>();

        for (const row of rows) {
            const key = row.year_section_label || [row.year_level, row.section].filter(Boolean).join(' - ') || 'Unassigned';
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(row);
        }

        const aggregates: SectionAggregate[] = [];
        const target = requiredVisits || 4;

        for (const [key, sectionRows] of groups.entries()) {
            const sortedStudents = [...sectionRows].sort((a, b) => b.visit_count - a.visit_count || (a.name || '').localeCompare(b.name || ''));
            const totalVisits = sectionRows.reduce((sum, r) => sum + r.visit_count, 0);
            const studentCount = sectionRows.length;
            const averageVisits = studentCount > 0 ? Math.round((totalVisits / studentCount) * 10) / 10 : 0;
            const metRequiredCount = sectionRows.filter((r) => r.visit_count >= target).length;
            const completionPercent = studentCount > 0 ? Math.round((metRequiredCount / studentCount) * 100) : 0;
            const firstRow = sectionRows[0];
            const yearLevel = firstRow?.year_level || 'Unknown';

            aggregates.push({
                key,
                label: key,
                yearLevel,
                sectionName: firstRow?.section || key,
                department: inferDepartment(yearLevel),
                totalVisits,
                studentCount,
                averageVisits,
                metRequiredCount,
                completionPercent,
                students: sortedStudents,
                topStudent: sortedStudents[0] && sortedStudents[0].visit_count > 0 ? sortedStudents[0] : (sortedStudents[0] ?? null),
            });
        }

        return aggregates.sort((a, b) => b.totalVisits - a.totalVisits || a.label.localeCompare(b.label));
    }, [rows, requiredVisits]);
}
