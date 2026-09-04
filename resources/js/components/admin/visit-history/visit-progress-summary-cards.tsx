import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { BriefcaseBusiness, ChevronRight, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { VisitorTypeFilter, VisitorWithRangeVisits } from './visit-logs-helpers';

interface RankedSummaryItem {
    label: string;
    visits: number;
    visitors: number;
    averagePercent: number;
    rawYearLevel: string;
    rawSection: string;
    rawDept: string;
}

interface VisitProgressSummaryCardsProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: VisitorTypeFilter;
    requiredVisits: number;
    onYearLevelChange?: (value: string) => void;
    onSectionChange?: (value: string) => void;
    onDepartmentChange?: (value: string) => void;
    activeYearLevel?: string;
    activeSection?: string;
    activeDepartment?: string;
}

export function VisitProgressSummaryCards({
    visitors,
    visitorType,
    requiredVisits,
    onYearLevelChange,
    onSectionChange,
    onDepartmentChange,
    activeYearLevel,
    activeSection,
    activeDepartment,
}: VisitProgressSummaryCardsProps) {
    const data = useMemo(() => {
        const targetVisitors = visitors.filter((v) => v.type === visitorType && v.rangeVisits.length > 0);
        const sectionMap = new Map<string, { visits: number; visitors: number; totalPercent: number; rawYearLevel: string; rawSection: string }>();
        const employeeDeptMap = new Map<string, { visits: number; visitors: number; totalPercent: number; rawDept: string }>();

        targetVisitors.forEach((visitor) => {
            const visits = visitor.rangeVisits.length;
            const percent = requiredVisits > 0 ? Math.min(100, Math.round((visits / requiredVisits) * 100)) : 100;

            if (visitorType === 'student') {
                const sectionKey = [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'Unassigned';

                const sCurrent = sectionMap.get(sectionKey) ?? {
                    visits: 0,
                    visitors: 0,
                    totalPercent: 0,
                    rawYearLevel: visitor.yearLevel ?? '',
                    rawSection: visitor.section ?? '',
                };
                sectionMap.set(sectionKey, {
                    ...sCurrent,
                    visits: sCurrent.visits + visits,
                    visitors: sCurrent.visitors + 1,
                    totalPercent: sCurrent.totalPercent + percent,
                });
            } else {
                const employeeDeptKey = visitor.department || 'Unassigned';
                const dCurrent = employeeDeptMap.get(employeeDeptKey) ?? {
                    visits: 0,
                    visitors: 0,
                    totalPercent: 0,
                    rawDept: visitor.department ?? '',
                };
                employeeDeptMap.set(employeeDeptKey, {
                    ...dCurrent,
                    visits: dCurrent.visits + visits,
                    visitors: dCurrent.visitors + 1,
                    totalPercent: dCurrent.totalPercent + percent,
                });
            }
        });

        const toRankedList = (
            map: Map<
                string,
                { visits: number; visitors: number; totalPercent: number; rawYearLevel?: string; rawSection?: string; rawDept?: string }
            >,
        ): RankedSummaryItem[] =>
            Array.from(map.entries())
                .map(([label, stats]) => ({
                    label,
                    visits: stats.visits,
                    visitors: stats.visitors,
                    averagePercent: stats.visitors > 0 ? Math.round(stats.totalPercent / stats.visitors) : 0,
                    rawYearLevel: stats.rawYearLevel ?? '',
                    rawSection: stats.rawSection ?? '',
                    rawDept: stats.rawDept ?? '',
                }))
                .sort((a, b) => b.visits - a.visits);

        return {
            sections: toRankedList(sectionMap),
            employeeDepartments: toRankedList(employeeDeptMap),
        };
    }, [visitors, visitorType, requiredVisits]);

    const filteredSections = useMemo(() => {
        return data.sections.filter((s) => {
            if (activeYearLevel && s.rawYearLevel !== activeYearLevel) return false;
            if (activeSection && s.rawSection !== activeSection) return false;
            return true;
        });
    }, [data.sections, activeYearLevel, activeSection]);

    if (visitorType === 'employee') {
        return (
            <div className="flex h-full w-full flex-col">
                <SummaryCard
                    title="Top Departments"
                    icon={<BriefcaseBusiness className="size-5 text-[#030A8C]" />}
                    items={data.employeeDepartments}
                    onClick={(item) => onDepartmentChange?.(item.rawDept === activeDepartment ? '' : item.rawDept)}
                    isActive={(item) => item.rawDept === activeDepartment}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col">
            <SummaryCard
                title="Year Levels and Sections"
                icon={<Users className="size-5 text-[#030A8C]" />}
                items={filteredSections}
                onClick={(item) => {
                    if (item.rawYearLevel === activeYearLevel && item.rawSection === activeSection) {
                        onYearLevelChange?.('');
                        onSectionChange?.('');
                    } else {
                        onYearLevelChange?.(item.rawYearLevel);
                        onSectionChange?.(item.rawSection);
                    }
                }}
                isActive={(item) => item.rawYearLevel === activeYearLevel && item.rawSection === activeSection}
            />
        </div>
    );
}

function SummaryCard({
    title,
    icon,
    items,
    onClick,
    isActive,
}: {
    title: string;
    icon: ReactNode;
    items: RankedSummaryItem[];
    onClick?: (item: RankedSummaryItem) => void;
    isActive?: (item: RankedSummaryItem) => boolean;
}) {
    const [showAll, setShowAll] = useState(false);
    const displayedItems = items;
    const hasMore = false;

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-[#040DBF]/10 px-5 py-4 dark:border-slate-800">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#f6f8ff] dark:bg-slate-800">{icon}</div>
                <h3 className="text-sm font-semibold tracking-normal text-[#010440] dark:text-white">{title}</h3>
            </div>
            {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#f6f8ff] dark:bg-slate-800">
                        <Users className="size-6 text-[#020659]/30 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-[#020659]/70 dark:text-slate-400">No activity found</p>
                    <p className="mt-1 text-xs text-[#020659]/40 dark:text-slate-500">Try adjusting your filters or date range.</p>
                </div>
            ) : (
                <div className="hover-scrollbar flex flex-1 flex-col overflow-y-auto">
                    {displayedItems.map((item, index) => {
                        const active = isActive?.(item);

                        return (
                            <div
                                key={item.label}
                                onClick={() => onClick?.(item)}
                                className={`group flex cursor-pointer flex-col gap-3 border-b border-[#040DBF]/5 px-5 py-4 transition-colors last:border-0 hover:bg-[#f6f8ff] dark:border-slate-800/60 dark:hover:bg-slate-800/50 ${active ? 'bg-[#f6f8ff] dark:bg-slate-800/70' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                                                index < 3
                                                    ? 'bg-[#030A8C] text-white dark:bg-blue-600'
                                                    : 'bg-[#f6f8ff] text-[#020659]/60 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="text-[13px] font-semibold text-[#010440] dark:text-slate-100">{item.label}</div>
                                            <div className="mt-0.5 text-[11px] font-medium text-[#020659]/60 dark:text-slate-400">
                                                {item.visitors} active {item.visitors === 1 ? 'member' : 'members'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-[#010440] dark:text-white">{item.visits}</div>
                                        <div className="mt-0.5 text-[10px] font-semibold tracking-wider text-[#020659]/50 uppercase dark:text-slate-400">
                                            Visits
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ProgressBar value={item.averagePercent} className="flex-1" />
                                    <span className="min-w-[3ch] text-xs font-bold text-[#010440] dark:text-slate-200">{item.averagePercent}%</span>
                                </div>
                            </div>
                        );
                    })}
                    {hasMore && (
                        <button
                            type="button"
                            onClick={() => setShowAll(!showAll)}
                            className="flex w-full items-center justify-center gap-1.5 border-t border-[#040DBF]/5 py-3 text-xs font-semibold text-[#030A8C] transition-colors hover:bg-[#f6f8ff]"
                        >
                            {showAll ? 'Show less' : `View all ${items.length}`}
                            <ChevronRight className={`size-3.5 transition-transform ${showAll ? '-rotate-90' : 'rotate-90'}`} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
