import { FilterSelect } from '@/components/admin/live-visits/live-visits-table-ui';
import { BarChart3, Search, X } from 'lucide-react';
import type { VisitTab } from './live-visits-table-helpers';
import type { LiveVisitTabOption } from './use-live-visits-table';

interface LiveVisitsTableHeaderProps {
    title: string;
    description: string;
    visitTab: VisitTab;
    visitTabs: LiveVisitTabOption[];
    search: string;
    yearLevel: string;
    section: string;
    department: string;
    yearLevelOptions: string[];
    sectionOptions: string[];
    departmentOptions: string[];
    onVisitTabChange: (tab: VisitTab) => void;
    onSearchChange: (value: string) => void;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
}

export function LiveVisitsTableHeader({
    title,
    description,
    visitTab,
    visitTabs,
    search,
    yearLevel,
    section,
    department,
    yearLevelOptions,
    sectionOptions,
    departmentOptions,
    onVisitTabChange,
    onSearchChange,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
}: LiveVisitsTableHeaderProps) {
    return (
        <div className="space-y-4 border-b border-[#040DBF]/10 bg-[#f8faff] px-5 py-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div>
                <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-[#040DBF] dark:text-sky-400" />
                    <h2 className="text-lg font-bold tracking-tight text-[#010440] dark:text-white">{title}</h2>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{description}</p>
            </div>
            <div className="space-y-3">
                <div className="admin-segmented-tabs w-full sm:w-fit">
                    {visitTabs.map((tab) => (
                        <LiveVisitTabButton key={tab.value} tab={tab} activeTab={visitTab} onChange={onVisitTabChange} />
                    ))}
                </div>
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-[12rem_12rem_minmax(16rem,24rem)]">
                    {visitTab === 'student' ? (
                        <>
                            <FilterSelect value={yearLevel} options={yearLevelOptions} placeholder="All year levels" onChange={onYearLevelChange} />
                            <FilterSelect
                                value={section}
                                options={sectionOptions}
                                placeholder={yearLevel ? 'All sections' : 'Choose year level first'}
                                disabled={!yearLevel}
                                onChange={onSectionChange}
                            />
                        </>
                    ) : (
                        <FilterSelect value={department} options={departmentOptions} placeholder="All departments" onChange={onDepartmentChange} />
                    )}
                    <div className={visitTab === 'student' ? 'relative md:col-span-1' : 'relative md:col-span-2'}>
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder={visitTab === 'student' ? 'Search ID, name, section' : 'Search ID, name, department'}
                            className="h-10 w-full rounded-lg border border-[#040DBF]/20 bg-white pr-9 pl-9 text-sm text-[#010440] transition outline-none placeholder:text-slate-500 focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-[#040DBF]/5 hover:text-[#010440] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                title="Clear search"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function LiveVisitTabButton({ tab, activeTab, onChange }: { tab: LiveVisitTabOption; activeTab: VisitTab; onChange: (tab: VisitTab) => void }) {
    const Icon = tab.icon;
    const isActive = activeTab === tab.value;

    return (
        <button type="button" onClick={() => onChange(tab.value)} className={`admin-segmented-tab ${isActive ? 'admin-segmented-tab-active' : ''}`}>
            <Icon className="size-3.5" />
            {tab.label}
            <span className={isActive ? 'text-white/75' : 'text-[#030A8C]/60 dark:text-slate-400'}>{tab.count}</span>
        </button>
    );
}
