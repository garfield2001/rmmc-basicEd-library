import { SelectInput } from '@/components/ui/select-input';

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
}: VisitorsFilterBarProps) {
    return (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mx-auto w-full max-w-2xl">
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
                    <div className="mx-auto grid w-full gap-3 sm:max-w-sm">
                        <FilterSelect value={department} options={departments} placeholder="Select department" onChange={onDepartmentChange} />
                    </div>
                )}
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
