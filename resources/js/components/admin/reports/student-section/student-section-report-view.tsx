import type { VisitReport, VisitReportRow } from '@/types/reports';
import { LayoutGrid } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ReportExportActions, type ReportExportActionsProps } from '../report-export-actions';
import { StudentSectionDetail } from './student-section-detail';
import { StudentSectionSidebar } from './student-section-sidebar';
import { StudentVisitHistoryModal } from './student-visit-history-modal';
import { useStudentSectionAggregates } from './use-student-section-aggregates';

interface StudentSectionReportViewProps {
    report: VisitReport;
    exportUrls: ReportExportActionsProps;
}

export function StudentSectionReportView({ report, exportUrls }: StudentSectionReportViewProps) {
    const requiredVisits = report.summary.required_visits || 4;
    const sections = useStudentSectionAggregates(report.rows, requiredVisits);

    const [activeSectionKey, setActiveSectionKey] = useState<string | null>(() => sections[0]?.key ?? null);
    const [sectionSearch, setSectionSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<VisitReportRow | null>(null);

    const activeSection = useMemo(() => {
        return sections.find((s) => s.key === activeSectionKey) || sections[0] || null;
    }, [sections, activeSectionKey]);

    return (
        <div className="space-y-4">
            {/* Header Toolbar: Section Count & Export Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#040DBF]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#010440] shadow-xs">
                        <LayoutGrid className="size-3.5 text-[#040DBF]" />
                        <span>Sections Breakdown ({sections.length})</span>
                    </span>
                    <span className="text-xs font-medium text-[#020659]/60">{report.rows.length.toLocaleString()} total students</span>
                </div>

                <div className="flex items-center gap-2">
                    <ReportExportActions {...exportUrls} />
                </div>
            </div>

            {/* Main Sections Workspace */}
            <section className="admin-surface overflow-hidden rounded-xl border border-[#040DBF]/10 bg-white/95 shadow-sm">
                <div className="h-1.5 w-full bg-[#040DBF]" />
                <div className="flex flex-col divide-y divide-[#040DBF]/10 md:flex-row md:divide-x md:divide-y-0">
                    <StudentSectionSidebar
                        sections={sections}
                        activeSectionKey={activeSection?.key ?? null}
                        searchQuery={sectionSearch}
                        onSearchChange={setSectionSearch}
                        onSelectSection={setActiveSectionKey}
                    />
                    <StudentSectionDetail
                        activeSection={activeSection}
                        requiredVisits={requiredVisits}
                        reportFilters={report.filters}
                        onSelectStudent={setSelectedStudent}
                    />
                </div>
            </section>

            {/* Student Visit History Popup Modal */}
            <StudentVisitHistoryModal
                student={selectedStudent}
                startDate={report.filters.start_date}
                endDate={report.filters.end_date}
                open={selectedStudent !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedStudent(null);
                }}
            />
        </div>
    );
}
