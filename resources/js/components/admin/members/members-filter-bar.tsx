import { SelectInput } from '@/components/ui/select-input';
import { BriefcaseBusiness, GraduationCap, Search } from 'lucide-react';

type MemberType = 'student' | 'employee';

interface MembersFilterBarProps {
    activeType: MemberType;
    search: string;
    yearLevel: string;
    section: string;
    yearLevels: string[];
    sections: string[];
    onSearchChange: (value: string) => void;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onTypeChange: (type: MemberType) => void;
}

export function MembersFilterBar({
    activeType,
    search,
    yearLevel,
    section,
    yearLevels,
    sections,
    onSearchChange,
    onYearLevelChange,
    onSectionChange,
    onTypeChange,
}: MembersFilterBarProps) {
    const tabs = [
        { label: 'Students', value: 'student' as const, icon: GraduationCap },
        { label: 'Employees', value: 'employee' as const, icon: BriefcaseBusiness },
    ];

    return (
        <section className="min-h-30 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="admin-segmented-tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeType === tab.value;

                        return (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => onTypeChange(tab.value)}
                                className={`admin-segmented-tab ${isActive ? 'admin-segmented-tab-active' : ''}`}
                            >
                                <Icon className="size-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-1 flex-col gap-3 transition-all duration-300 ease-out lg:max-w-3xl">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            value={search}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder={`Search ${activeType === 'student' ? 'students' : 'employees'}`}
                            className="h-10 w-full rounded-lg border border-zinc-300 pr-3 pl-9 text-sm outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                        />
                    </div>

                    <div
                        className={`grid gap-3 overflow-hidden transition-all duration-300 ease-out sm:grid-cols-2 ${
                            activeType === 'student' ? 'max-h-14 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
                        }`}
                        aria-hidden={activeType !== 'student'}
                    >
                        <FilterSelect value={yearLevel} options={yearLevels} placeholder="All year levels" onChange={onYearLevelChange} />
                        <FilterSelect
                            value={section}
                            options={sections}
                            placeholder={yearLevel ? 'All sections' : 'Choose year level first'}
                            disabled={!yearLevel}
                            onChange={onSectionChange}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function FilterSelect({
    value,
    options,
    placeholder,
    disabled = false,
    onChange,
}: {
    value: string;
    options: string[];
    placeholder: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <SelectInput
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className="border-zinc-300 text-zinc-700 focus:border-zinc-500 focus:ring-zinc-100"
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </SelectInput>
    );
}
