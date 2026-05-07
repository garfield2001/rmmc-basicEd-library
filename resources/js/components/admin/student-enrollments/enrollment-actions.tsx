import { Button } from '@/components/ui/button';
import { router, useForm } from '@inertiajs/react';
import { MoveRight } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { FormEventHandler } from 'react';

interface EnrollmentActionsProps {
    selectedIds: number[];
    allMatchingSelected: boolean;
    schoolYearId: number;
    filters: {
        search: string;
        sourceSchoolYearId: number;
        sourceYearLevel: string;
        sourceSection: string;
        sourceMemberStatus: string;
    };
    yearLevels: string[];
    sectionsByYearLevel: Record<string, string[]>;
    hasDistinctSchoolYears: boolean;
}

interface PlacementForm {
    [key: string]: string | number | number[] | boolean | Record<string, string>;
    school_year_id: number;
    member_ids: number[];
    year_level: string;
    section: string;
    status: 'pending';
    select_all: boolean;
    filters: Record<string, string>;
}

export function EnrollmentActions({
    selectedIds,
    allMatchingSelected,
    schoolYearId,
    filters,
    yearLevels,
    sectionsByYearLevel,
    hasDistinctSchoolYears,
}: EnrollmentActionsProps) {
    const form = useForm<PlacementForm>({
        school_year_id: schoolYearId,
        member_ids: selectedIds,
        year_level: '',
        section: '',
        status: 'pending',
        select_all: false,
        filters: {},
    });
    const actionFilters = {
        search: filters.search,
        source_school_year_id: String(filters.sourceSchoolYearId),
        source_year_level: filters.sourceYearLevel,
        source_section: filters.sourceSection,
        source_member_status: filters.sourceMemberStatus,
    };
    const selectedCountLabel = allMatchingSelected ? 'all matching source students' : `${selectedIds.length} selected`;
    const hasSelection = hasDistinctSchoolYears && (allMatchingSelected || selectedIds.length > 0);
    const targetYearLevels = useMemo(() => {
        const sourceIndex = levelIndex(filters.sourceYearLevel, yearLevels);

        return sourceIndex === -1 ? yearLevels : yearLevels.filter((_, index) => index >= sourceIndex);
    }, [filters.sourceYearLevel, yearLevels]);
    const sectionOptions = form.data.year_level ? (sectionsByYearLevel[form.data.year_level] ?? []) : [];

    useEffect(() => {
        form.setData('school_year_id', schoolYearId);
        form.setData('member_ids', selectedIds);
        form.setData('select_all', allMatchingSelected);
        form.setData('filters', actionFilters);
    }, [allMatchingSelected, schoolYearId, selectedIds, filters.search, filters.sourceSchoolYearId, filters.sourceYearLevel, filters.sourceSection, filters.sourceMemberStatus]);

    useEffect(() => {
        if (form.data.year_level && !targetYearLevels.includes(form.data.year_level)) {
            form.setData('year_level', '');
            form.setData('section', '');
        }
    }, [filters.sourceYearLevel, targetYearLevels]);

    const submitPlacement: FormEventHandler = (event) => {
        event.preventDefault();
        router.patch(
            '/admin/student-enrollments/bulk-assign',
            { ...form.data, member_ids: selectedIds, select_all: allMatchingSelected, filters: actionFilters, status: 'pending' },
            { preserveScroll: true },
        );
    };

    return (
        <form onSubmit={submitPlacement} className="admin-surface h-full rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold tracking-normal text-[#010440]">New/target placement</h2>
                <p className="text-sm text-[#020659]/70">
                    {hasDistinctSchoolYears
                        ? `${selectedCountLabel}. Choose the next year level and optionally assign a section.`
                        : 'Choose a different target school year before transferring students.'}
                </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <select
                    value={form.data.year_level}
                    onChange={(event) => {
                        form.setData('year_level', event.target.value);
                        form.setData('section', '');
                    }}
                    className={inputClass}
                >
                    <option value="">Target year level</option>
                    {targetYearLevels.map((yearLevel) => (
                        <option key={yearLevel} value={yearLevel}>
                            {yearLevel}
                        </option>
                    ))}
                </select>
                <input
                    list="target-section-options"
                    value={form.data.section}
                    onChange={(event) => form.setData('section', event.target.value)}
                    placeholder={form.data.year_level ? 'Target section optional' : 'Choose year level first'}
                    disabled={!form.data.year_level}
                    className={inputClass}
                />
                <datalist id="target-section-options">
                    {sectionOptions.map((section) => (
                        <option key={section} value={section} />
                    ))}
                </datalist>
                <Button type="submit" disabled={!hasSelection || !form.data.year_level} className="w-full md:w-auto">
                    <MoveRight className="size-4" />
                    Transfer
                </Button>
            </div>
        </form>
    );
}

const inputClass =
    'h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60';

function levelIndex(yearLevel: string, yearLevels: string[]) {
    return yearLevels.findIndex((level) => level === yearLevel);
}
