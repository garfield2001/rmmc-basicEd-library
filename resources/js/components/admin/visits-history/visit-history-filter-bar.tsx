import { VisitTypeTab } from '@/components/admin/visits-history/visit-history-ui';
import { SelectInput } from '@/components/ui/select-input';
import type { AdminVisitHistory } from '@/types/dashboard';
import { BriefcaseBusiness, GraduationCap, Search, X } from 'lucide-react';
import type { VisitorTypeFilter } from './visit-history-helpers';

interface VisitHistoryFilterBarProps {
    filters: AdminVisitHistory['filters'];
    metrics: AdminVisitHistory['metrics'];
    visitorType: VisitorTypeFilter;
    yearLevel: string;
    section: string;
    department: string;
    search: string;
    onVisitorTypeChange: (value: VisitorTypeFilter) => void;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onSearchChange: (value: string) => void;
}

export function VisitHistoryFilterBar({
    filters,
    metrics,
    visitorType,
    yearLevel,
    section,
    department,
    search,
    onVisitorTypeChange,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    onSearchChange,
}: VisitHistoryFilterBarProps) {
    return (
        <div className="space-y-4 border-b border-[#040DBF]/10 px-5 py-4">
            <div className="admin-segmented-tabs w-full sm:w-fit">
                <VisitTypeTab
                    value="student"
                    activeValue={visitorType}
                    label="Students"
                    count={metrics.studentVisitors}
                    icon={GraduationCap}
                    onChange={onVisitorTypeChange}
                />
                <VisitTypeTab
                    value="employee"
                    activeValue={visitorType}
                    label="Employees"
                    count={metrics.employeeVisitors}
                    icon={BriefcaseBusiness}
                    onChange={onVisitorTypeChange}
                />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                {visitorType === 'student' && (
                    <>
                        <SelectInput value={yearLevel} onChange={(event) => onYearLevelChange(event.target.value)}>
                            <option value="">All year levels</option>
                            {filters.yearLevels.map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </SelectInput>
                        <SelectInput value={section} onChange={(event) => onSectionChange(event.target.value)} disabled={!yearLevel}>
                            <option value="">{yearLevel ? 'All sections' : 'Choose year level first'}</option>
                            {(filters.sectionsByYearLevel[yearLevel] ?? []).map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </SelectInput>
                    </>
                )}

                {visitorType === 'employee' && (
                    <SelectInput value={department} onChange={(event) => onDepartmentChange(event.target.value)} wrapperClassName="xl:col-span-2">
                        <option value="">All departments</option>
                        {filters.departments.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </SelectInput>
                )}

                <div className="relative md:col-span-2 xl:col-span-3">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                    <input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search ID, name, section, department"
                        className="h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-9 pl-9 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#030A8C]/50 transition hover:bg-[#040DBF]/5 hover:text-[#010440]"
                            title="Clear search"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
