import { FilterSelect } from '@/components/admin/live-visits/live-visits-table-ui';
import { BarChart3, Search, X } from 'lucide-react';
import type { LiveVisitTabOption } from './use-live-visits-table';
import type { VisitTab } from './live-visits-table-helpers';

interface LiveVisitsTableHeaderProps {
    title: string;
    description: string;
    visitTab: VisitTab;
    visitTabs: LiveVisitTabOption[];
    search: string;
    yearLevel: string;
    section: string;
    yearLevelOptions: string[];
    sectionOptions: string[];
    onVisitTabChange: (tab: VisitTab) => void;
    onSearchChange: (value: string) => void;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
}

export function LiveVisitsTableHeader({
    title,
    description,
    visitTab,
    visitTabs,
    search,
    yearLevel,
    section,
    yearLevelOptions,
    sectionOptions,
    onVisitTabChange,
    onSearchChange,
    onYearLevelChange,
    onSectionChange,
}: LiveVisitsTableHeaderProps) {
    return (
        <div className="space-y-4 border-b border-[#040DBF]/10 px-5 py-4">
            <div>
                <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-[#030A8C]" />
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">{title}</h2>
                </div>
                <p className="mt-1 text-sm text-[#020659]/70">{description}</p>
            </div>
            <div className="space-y-3">
                <div className="admin-segmented-tabs w-full sm:w-fit">
                    {visitTabs.map((tab) => (
                        <LiveVisitTabButton key={tab.value} tab={tab} activeTab={visitTab} onChange={onVisitTabChange} />
                    ))}
                </div>
                {visitTab === 'student' && (
                    <div className="grid gap-3 sm:grid-cols-2 xl:max-w-3xl">
                        <FilterSelect value={yearLevel} options={yearLevelOptions} placeholder="All year levels" onChange={onYearLevelChange} />
                        <FilterSelect
                            value={section}
                            options={sectionOptions}
                            placeholder={yearLevel ? 'All sections' : 'Choose year level first'}
                            disabled={!yearLevel}
                            onChange={onSectionChange}
                        />
                    </div>
                )}
                <div className="relative w-full xl:max-w-3xl">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                    <input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={visitTab === 'student' ? 'Search ID, name, section' : 'Search ID, name, department'}
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

function LiveVisitTabButton({
    tab,
    activeTab,
    onChange,
}: {
    tab: LiveVisitTabOption;
    activeTab: VisitTab;
    onChange: (tab: VisitTab) => void;
}) {
    const Icon = tab.icon;
    const isActive = activeTab === tab.value;

    return (
        <button type="button" onClick={() => onChange(tab.value)} className={`admin-segmented-tab ${isActive ? 'admin-segmented-tab-active' : ''}`}>
            <Icon className="size-3.5" />
            {tab.label}
            <span className={isActive ? 'text-white/75' : 'text-[#030A8C]/60'}>{tab.count}</span>
        </button>
    );
}
