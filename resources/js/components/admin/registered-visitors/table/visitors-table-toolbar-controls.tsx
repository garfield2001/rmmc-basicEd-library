import { SearchableSelect } from '@/components/ui/searchable-select';
import { BriefcaseBusiness, GraduationCap, Search, X } from 'lucide-react';
import type { VisitorType } from './visitors-table-types';

export function VisitorsTableTitle({ activeType }: { activeType: VisitorType }) {
    return (
        <div>
            <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-[#030A8C]" />
                <h2 className="text-lg font-semibold tracking-normal text-[#010440]">
                    {activeType === 'student' ? 'Registered students' : 'Registered employees'}
                </h2>
            </div>
            <p className="mt-1 text-sm text-[#020659]/70">
                {activeType === 'student'
                    ? 'Rows are sorted to keep the highest grade levels, including Grade 10, easy to scan.'
                    : 'Rows are grouped by active employee details for the selected school year.'}
            </p>
        </div>
    );
}

export function VisitorTypeTabs({ activeType, onTypeChange }: { activeType: VisitorType; onTypeChange: (type: VisitorType) => void }) {
    const visitorTabs = [
        { label: 'Students', value: 'student' as const, icon: GraduationCap },
        { label: 'Employees', value: 'employee' as const, icon: BriefcaseBusiness },
    ];

    return (
        <div className="admin-segmented-tabs w-full">
            {visitorTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeType === tab.value;

                return (
                    <button key={tab.value} type="button" onClick={() => onTypeChange(tab.value)} className={`admin-segmented-tab ${isActive ? 'admin-segmented-tab-active' : ''}`}>
                        <Icon className="size-4" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

export function VisitorSearchInput({ activeType, search, onSearchChange }: { activeType: VisitorType; search: string; onSearchChange: (value: string) => void }) {
    return (
        <div className="relative min-w-0">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={`Search ${activeType === 'student' ? 'students' : 'employees'}`}
                className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-9 pl-9 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
            />
            {search && (
                <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    title="Clear search"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}

export function FilterSelect({
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
    const searchableOptions = [{ value: '', label: placeholder }, ...options.map((option) => ({ value: option, label: option }))];

    return (
        <SearchableSelect
            value={value}
            options={searchableOptions}
            placeholder={placeholder}
            searchPlaceholder={`Search ${placeholder.toLowerCase()}`}
            disabled={disabled}
            className="border-zinc-300 bg-white text-zinc-700 focus:border-zinc-500 focus:ring-zinc-100"
            onChange={onChange}
        />
    );
}
