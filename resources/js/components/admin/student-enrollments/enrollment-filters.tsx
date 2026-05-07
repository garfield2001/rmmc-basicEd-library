import type { SchoolYearOption } from '@/types/enrollments';

interface EnrollmentFiltersProps {
    schoolYears: SchoolYearOption[];
    yearLevels: string[];
    sourceSections: string[];
    filters: {
        sourceSchoolYearId: number;
        targetSchoolYearId: number;
        search: string;
        sourceYearLevel: string;
        sourceSection: string;
        sourceMemberStatus: string;
        perPage: number;
        sort: string;
        direction: 'asc' | 'desc';
    };
    onChange: (filters: EnrollmentFiltersProps['filters']) => void;
}

export function EnrollmentFilters({ schoolYears, yearLevels, sourceSections, filters, onChange }: EnrollmentFiltersProps) {
    const update = (key: keyof EnrollmentFiltersProps['filters'], value: string | number) => {
        onChange({
            ...filters,
            [key]: value,
            ...(key === 'sourceYearLevel' ? { sourceSection: '' } : {}),
        });
    };

    return (
        <section className="admin-surface h-full rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Old/source enrollment</h2>
                </div>
                <p className="text-sm text-[#020659]/70">
                    Find students from the previous school year before transferring them to the target placement.
                </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SchoolYearSelect
                    value={filters.sourceSchoolYearId}
                    label="Source school year"
                    schoolYears={schoolYears}
                    onChange={(value) => update('sourceSchoolYearId', value)}
                />
                <SchoolYearSelect
                    value={filters.targetSchoolYearId}
                    label="Target school year"
                    schoolYears={schoolYears}
                    onChange={(value) => update('targetSchoolYearId', value)}
                />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
                <SimpleSelect
                    label="All source year levels"
                    value={filters.sourceYearLevel}
                    options={yearLevels}
                    onChange={(value) => update('sourceYearLevel', value)}
                />
                <SimpleSelect
                    label={filters.sourceYearLevel ? 'All source sections' : 'Choose source year first'}
                    value={filters.sourceSection}
                    options={sourceSections}
                    disabled={!filters.sourceYearLevel}
                    onChange={(value) => update('sourceSection', value)}
                />
                <select
                    value={filters.sourceMemberStatus}
                    onChange={(event) => update('sourceMemberStatus', event.target.value)}
                    className={selectClass}
                >
                    <option value="">All active states</option>
                    <option value="active">Active students</option>
                    <option value="inactive">Inactive students</option>
                </select>
            </div>
        </section>
    );
}

function SchoolYearSelect({
    label,
    value,
    schoolYears,
    onChange,
}: {
    label: string;
    value: number;
    schoolYears: SchoolYearOption[];
    onChange: (value: number) => void;
}) {
    return (
        <select value={value} onChange={(event) => onChange(Number(event.target.value))} className={selectClass}>
            {schoolYears.map((schoolYear) => (
                <option key={schoolYear.id} value={schoolYear.id}>
                    {label}: {schoolYear.name}
                    {schoolYear.is_active ? ' (active)' : ''}
                </option>
            ))}
        </select>
    );
}

function SimpleSelect({
    label,
    value,
    options,
    disabled,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={selectClass}>
            <option value="">{label}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}

const selectClass =
    'h-10 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60';
