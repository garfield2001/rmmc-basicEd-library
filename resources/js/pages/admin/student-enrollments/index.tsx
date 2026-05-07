import { EnrollmentActions } from '@/components/admin/student-enrollments/enrollment-actions';
import { EnrollmentFilters } from '@/components/admin/student-enrollments/enrollment-filters';
import { EnrollmentTable } from '@/components/admin/student-enrollments/enrollment-table';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { StudentEnrollmentPageProps } from '@/types/enrollments';
import { Head, router } from '@inertiajs/react';
import { ClipboardList, FileCheck2, ListChecks } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function StudentEnrollments({ students, schoolYears, filters, options }: StudentEnrollmentPageProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [allMatchingSelected, setAllMatchingSelected] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        sourceSchoolYearId: filters.source_school_year_id,
        targetSchoolYearId: filters.target_school_year_id,
        search: filters.search,
        sourceYearLevel: filters.source_year_level,
        sourceSection: filters.source_section,
        sourceMemberStatus: filters.source_member_status,
        perPage: filters.per_page,
        sort: filters.sort,
        direction: filters.direction,
    });
    const sourceSections = useMemo(() => {
        return localFilters.sourceYearLevel ? (options.sourceSectionsByYearLevel[localFilters.sourceYearLevel] ?? []) : [];
    }, [localFilters.sourceYearLevel, options.sourceSectionsByYearLevel]);
    const placementYearLevels = useMemo(() => options.yearLevels.filter((yearLevel) => yearLevel !== 'Kindergarten'), [options.yearLevels]);
    const hasDistinctSchoolYears = localFilters.sourceSchoolYearId !== localFilters.targetSchoolYearId;
    useEffect(() => {
        const matches =
            localFilters.sourceSchoolYearId === filters.source_school_year_id &&
            localFilters.targetSchoolYearId === filters.target_school_year_id &&
            localFilters.search === filters.search &&
            localFilters.sourceYearLevel === filters.source_year_level &&
            localFilters.sourceSection === filters.source_section &&
            localFilters.sourceMemberStatus === filters.source_member_status &&
            localFilters.perPage === filters.per_page &&
            localFilters.sort === filters.sort &&
            localFilters.direction === filters.direction;

        if (matches) {
            return;
        }

        const timer = window.setTimeout(() => {
            router.get(
                '/admin/student-enrollments',
                {
                    source_school_year_id: localFilters.sourceSchoolYearId,
                    target_school_year_id: localFilters.targetSchoolYearId,
                    search: localFilters.search || undefined,
                    source_year_level: localFilters.sourceYearLevel || undefined,
                    source_section: localFilters.sourceYearLevel ? localFilters.sourceSection || undefined : undefined,
                    source_member_status: localFilters.sourceMemberStatus || undefined,
                    per_page: localFilters.perPage,
                    sort: localFilters.sort,
                    direction: localFilters.direction,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [filters, localFilters]);

    useEffect(() => {
        setSelectedIds([]);
        setAllMatchingSelected(false);
    }, [
        filters.source_school_year_id,
        filters.target_school_year_id,
        filters.search,
        filters.source_year_level,
        filters.source_section,
        filters.source_member_status,
        filters.per_page,
        filters.sort,
        filters.direction,
    ]);

    return (
        <>
            <Head title="Student Placement" />
            <main className="min-h-screen">
                <AdminLayout active="student-enrollments">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Student Placement"
                            description="Review source enrollment, confirm who continues, then place only the students who should be tracked in the target school year."
                        />

                        <section className="grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    title: 'Choose source and target',
                                    detail: 'Keep old records intact while preparing the next enrollment list.',
                                    icon: ClipboardList,
                                },
                                {
                                    title: 'Confirm continuing students',
                                    detail: 'Use selection or paste official IDs instead of blindly promoting everyone.',
                                    icon: ListChecks,
                                },
                                {
                                    title: 'Preview before saving',
                                    detail: 'Catch missing IDs, duplicates, inactive students, and existing placements.',
                                    icon: FileCheck2,
                                },
                            ].map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div key={item.title} className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                                                <Icon className="size-5" />
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-[#010440]">{item.title}</h2>
                                                <p className="mt-1 text-sm leading-6 text-[#020659]/70">{item.detail}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </section>

                        <EnrollmentFilters
                            schoolYears={schoolYears}
                            yearLevels={placementYearLevels}
                            sourceSections={sourceSections}
                            filters={localFilters}
                            onChange={setLocalFilters}
                        />

                        <EnrollmentActions
                            selectedIds={selectedIds}
                            allMatchingSelected={allMatchingSelected}
                            schoolYearId={localFilters.targetSchoolYearId}
                            filters={localFilters}
                            yearLevels={placementYearLevels}
                            sectionsByYearLevel={options.targetSectionsByYearLevel}
                            hasDistinctSchoolYears={hasDistinctSchoolYears}
                        />

                        <EnrollmentTable
                            students={students}
                            selectedIds={selectedIds}
                            allMatchingSelected={allMatchingSelected}
                            perPage={localFilters.perPage}
                            sort={localFilters.sort}
                            direction={localFilters.direction}
                            search={localFilters.search}
                            onSelectedIdsChange={setSelectedIds}
                            onAllMatchingSelectedChange={setAllMatchingSelected}
                            onPerPageChange={(perPage) => setLocalFilters((current) => ({ ...current, perPage }))}
                            onSearchChange={(search) => setLocalFilters((current) => ({ ...current, search }))}
                            emptyMessage={
                                hasDistinctSchoolYears
                                    ? undefined
                                    : 'Create or select a different target school year first. Student Placement needs separate source and target school years.'
                            }
                            onSortChange={(sort) =>
                                setLocalFilters((current) => ({
                                    ...current,
                                    sort,
                                    direction: current.sort === sort && current.direction === 'asc' ? 'desc' : 'asc',
                                }))
                            }
                        />
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
