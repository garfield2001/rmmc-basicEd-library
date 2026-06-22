import { Button } from '@/components/ui/button';
import { formatDisplayDate } from '@/components/ui/date-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, BriefcaseBusiness, CalendarDays, GraduationCap, ListChecks, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildWatchlist, matchesWatchlistGroup, type WatchlistGroup } from './visit-log-watchlist';
import type { VisitorWithRangeVisits } from './visit-logs-helpers';
import {
    BreakdownList,
    employeeCount,
    ProgressDistributionChart,
    studentCount,
    WatchlistChart,
    WatchlistSummaryCard,
    WatchlistTab,
    WatchlistTable,
    WeakGroupChart,
} from './visit-logs-watchlist-parts';

interface VisitLogsBreakdownProps {
    visitors: VisitorWithRangeVisits[];
    studentRequiredVisits: number;
    employeeRequiredVisits: number;
}

export function VisitLogsBreakdown({ visitors, studentRequiredVisits, employeeRequiredVisits }: VisitLogsBreakdownProps) {
    const [open, setOpen] = useState(false);
    const watchlist = useMemo(
        () => buildWatchlist(visitors, studentRequiredVisits, employeeRequiredVisits),
        [employeeRequiredVisits, studentRequiredVisits, visitors],
    );

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-[#010440]">Low-visit watchlist</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">
                        Open the watchlist to review low-activity groups and visitor names for the selected coverage.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" size="sm" className="gap-2">
                            <ListChecks className="size-4" />
                            Open watchlist
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Low-visit watchlist</DialogTitle>
                            <DialogDescription>
                                Review required-visit progress by person, section, year level, and department as of{' '}
                                {formatDisplayDate(watchlist.today)}.
                            </DialogDescription>
                        </DialogHeader>
                        <WatchlistContent watchlist={watchlist} />
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}

export function VisitLogsWatchlistPanel({
    visitors,
    studentRequiredVisits,
    employeeRequiredVisits,
    activeType,
    onActiveTypeChange,
}: VisitLogsBreakdownProps & {
    activeType: 'student' | 'employee';
    onActiveTypeChange: (type: 'student' | 'employee') => void;
}) {
    const watchlist = useMemo(
        () => buildWatchlist(visitors, studentRequiredVisits, employeeRequiredVisits),
        [employeeRequiredVisits, studentRequiredVisits, visitors],
    );

    return <WatchlistContent watchlist={watchlist} activeType={activeType} onActiveTypeChange={onActiveTypeChange} />;
}

function WatchlistContent({
    watchlist,
    activeType: controlledActiveType,
    onActiveTypeChange,
}: {
    watchlist: ReturnType<typeof buildWatchlist>;
    activeType?: 'student' | 'employee';
    onActiveTypeChange?: (type: 'student' | 'employee') => void;
}) {
    const [internalActiveType, setInternalActiveType] = useState<'student' | 'employee'>('student');
    const [activeGroup, setActiveGroup] = useState<WatchlistGroup>(null);
    const isControlled = controlledActiveType !== undefined;
    const activeType = controlledActiveType ?? internalActiveType;
    const changeActiveType = (type: 'student' | 'employee') => {
        setActiveGroup(null);
        setInternalActiveType(type);
        onActiveTypeChange?.(type);
    };
    const visibleRows = watchlist.attentionRows.filter((row) => row.visitor.type === activeType && matchesWatchlistGroup(row.visitor, activeGroup));
    const activeSummary = activeType === 'student' ? watchlist.studentSummary : watchlist.employeeSummary;
    const activeBuckets = activeType === 'student' ? watchlist.studentBuckets : watchlist.employeeBuckets;
    const activeGroups = activeType === 'student' ? watchlist.sections : watchlist.departments;
    const selectGroup = (group: Exclude<WatchlistGroup, null>) => {
        changeActiveType(group.kind === 'department' ? 'employee' : 'student');
        setActiveGroup(group);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                {isControlled ? (
                    <span className="rounded-full bg-[#040DBF]/10 px-3 py-1.5 text-xs font-semibold text-[#030A8C]">
                        {activeType === 'student' ? 'Student watchlist' : 'Employee watchlist'}
                    </span>
                ) : (
                    <div className="admin-segmented-tabs w-full sm:w-fit">
                        <WatchlistTab
                            active={activeType === 'student'}
                            label="Students"
                            count={studentCount(watchlist.attentionRows)}
                            onClick={() => changeActiveType('student')}
                        />
                        <WatchlistTab
                            active={activeType === 'employee'}
                            label="Employees"
                            count={employeeCount(watchlist.attentionRows)}
                            onClick={() => changeActiveType('employee')}
                        />
                    </div>
                )}
                {activeGroup && (
                    <button
                        type="button"
                        onClick={() => setActiveGroup(null)}
                        className="rounded-full bg-[#040DBF]/10 px-3 py-1.5 text-xs font-semibold text-[#030A8C] transition hover:bg-[#040DBF]/15"
                    >
                        Viewing {activeGroup.label} - clear
                    </button>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <WatchlistSummaryCard
                    icon={Target}
                    label="Target coverage"
                    value={`${activeSummary.percent}%`}
                    detail={`${activeSummary.visits.toLocaleString()} of ${activeSummary.requiredTotal.toLocaleString()} expected visits`}
                />
                <WatchlistSummaryCard
                    icon={AlertTriangle}
                    label="Below requirement"
                    value={activeSummary.belowTarget.toLocaleString()}
                    detail={`${activeSummary.metTarget.toLocaleString()} already met the target`}
                />
                <WatchlistSummaryCard
                    icon={ListChecks}
                    label="No visits yet"
                    value={activeSummary.noVisits.toLocaleString()}
                    detail="People with zero recorded visits"
                />
                <WatchlistSummaryCard
                    icon={CalendarDays}
                    label="Active today"
                    value={activeSummary.todayVisitors.toLocaleString()}
                    detail={`${activeSummary.todayVisits.toLocaleString()} visits today`}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
                <WatchlistChart title="Progress distribution" detail="How many people are at each required-visit progress level.">
                    <ProgressDistributionChart data={activeBuckets} />
                </WatchlistChart>
                <WatchlistChart
                    title={activeType === 'student' ? 'Weakest sections' : 'Weakest departments'}
                    detail="Lowest average completion first, with no-visit groups rising to the top."
                >
                    <WeakGroupChart data={activeGroups.slice(0, 8)} />
                </WatchlistChart>
            </div>

            <div className={`grid gap-4 ${activeType === 'student' ? 'xl:grid-cols-2' : 'xl:grid-cols-1'}`}>
                {activeType === 'student' ? (
                    <>
                        <BreakdownList
                            title="Low year levels"
                            icon={GraduationCap}
                            rows={watchlist.yearLevels}
                            kind="yearLevel"
                            onSelect={selectGroup}
                        />
                        <BreakdownList title="Low sections" icon={GraduationCap} rows={watchlist.sections} kind="section" onSelect={selectGroup} />
                    </>
                ) : (
                    <BreakdownList
                        title="Low departments"
                        icon={BriefcaseBusiness}
                        rows={watchlist.departments}
                        kind="department"
                        onSelect={selectGroup}
                    />
                )}
            </div>

            <WatchlistTable rows={visibleRows} />
        </div>
    );
}
