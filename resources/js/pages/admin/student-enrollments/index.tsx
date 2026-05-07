import { EnrollmentActions } from '@/components/admin/student-enrollments/enrollment-actions';
import { EnrollmentFilters } from '@/components/admin/student-enrollments/enrollment-filters';
import { EnrollmentTable } from '@/components/admin/student-enrollments/enrollment-table';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { StudentEnrollmentPageProps } from '@/types/enrollments';
import { Head, router } from '@inertiajs/react';
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
                    <div className="space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Student Placement"
                            description="Use the previous school year as a source list, then place students into the new school year."
                        />

                        <EnrollmentFilters
                            schoolYears={schoolYears}
                            yearLevels={options.yearLevels}
                            sourceSections={sourceSections}
                            filters={localFilters}
                            onChange={setLocalFilters}
                        />

                        <EnrollmentActions
                            selectedIds={selectedIds}
                            allMatchingSelected={allMatchingSelected}
                            schoolYearId={localFilters.targetSchoolYearId}
                            filters={localFilters}
                            yearLevels={options.yearLevels}
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
