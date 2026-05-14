import { SelectInput } from '@/components/ui/select-input';
import { BriefcaseBusiness, GraduationCap } from 'lucide-react';

type VisitorType = 'student' | 'employee';

interface VisitorsFilterBarProps {
    activeType: VisitorType;
    yearLevel: string;
    section: string;
    department: string;
    yearLevels: string[];
    sections: string[];
    departments: string[];
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onTypeChange: (type: VisitorType) => void;
}

export function VisitorsFilterBar({
    activeType,
    yearLevel,
    section,
    department,
    yearLevels,
    sections,
    departments,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    onTypeChange,
}: VisitorsFilterBarProps) {
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

                <div className="flex flex-1 flex-col gap-3 lg:max-w-3xl">
                    {activeType === 'student' ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FilterSelect value={yearLevel} options={yearLevels} placeholder="Select year level" onChange={onYearLevelChange} />
                            <FilterSelect
                                value={section}
                                options={sections}
                                placeholder={yearLevel ? 'Select section' : 'Choose year level first'}
                                disabled={!yearLevel}
                                onChange={onSectionChange}
                            />
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            <FilterSelect value={department} options={departments} placeholder="Select department" onChange={onDepartmentChange} />
                        </div>
                    )}
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
