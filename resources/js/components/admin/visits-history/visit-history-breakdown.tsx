import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { BriefcaseBusiness, GraduationCap, ListChecks, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { VisitorWithRangeVisits } from './visit-history-helpers';
import { buildWatchlist, watchlistGroupLabel } from './visit-log-watchlist';

interface VisitHistoryBreakdownProps {
    visitors: VisitorWithRangeVisits[];
    studentRequiredVisits: number;
    employeeRequiredVisits: number;
}

export function VisitHistoryBreakdown({ visitors, studentRequiredVisits, employeeRequiredVisits }: VisitHistoryBreakdownProps) {
    const [open, setOpen] = useState(false);
    const watchlist = useMemo(() => buildWatchlist(visitors, studentRequiredVisits, employeeRequiredVisits), [employeeRequiredVisits, studentRequiredVisits, visitors]);

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-[#010440]">Low-visit watchlist</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">Open the watchlist to review low-activity groups and visitor names for the selected coverage.</p>
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
                            <DialogDescription>Use this to find year levels, sections, departments, and people that may need follow-up.</DialogDescription>
                        </DialogHeader>
                        <WatchlistContent watchlist={watchlist} />
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}

function WatchlistContent({ watchlist }: { watchlist: ReturnType<typeof buildWatchlist> }) {
    return (
        <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-3">
                <BreakdownList title="Low year levels" icon={GraduationCap} rows={watchlist.yearLevels} />
                <BreakdownList title="Low sections" icon={GraduationCap} rows={watchlist.sections} />
                <BreakdownList title="Low departments" icon={BriefcaseBusiness} rows={watchlist.departments} />
            </div>
            <WatchlistTable rows={watchlist.attentionRows} />
        </div>
    );
}

function BreakdownList({ title, icon: Icon, rows }: { title: string; icon: LucideIcon; rows: Array<{ label: string; value: number }> }) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-[#010440]">
                <Icon className="size-4 text-[#040DBF]" />
                {title}
            </div>
            <div className="space-y-2">
                {rows.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-[#020659]/75">{row.label}</span>
                        <span className="font-semibold text-[#010440]">{row.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function WatchlistTable({ rows }: { rows: ReturnType<typeof buildWatchlist>['attentionRows'] }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-[#040DBF]/10">
            <table className="min-w-[720px] text-left text-sm">
                <thead className="border-b border-[#040DBF]/10 bg-[#f6f8ff] text-[#020659]/70">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Group</th>
                        <th className="px-4 py-3">Visits</th>
                        <th className="px-4 py-3">Progress</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length > 0 ? (
                        rows.map(({ visitor, required, visits, percent }) => (
                            <tr key={visitor.id} className="border-b border-[#040DBF]/5 last:border-0">
                                <td className="px-4 py-3 font-medium text-[#010440]">{visitor.name ?? '-'}</td>
                                <td className="px-4 py-3 text-[#020659]/70">{watchlistGroupLabel(visitor)}</td>
                                <td className="px-4 py-3 font-semibold text-[#010440]">{visits === 0 ? 'No visits yet' : `${visits} / ${required}`}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <ProgressBar value={percent} className="min-w-32 flex-1" />
                                        <span className="w-10 text-right font-semibold text-[#020659]">{percent}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-sm text-[#020659]/70">
                                Everyone in this coverage has met the required visit target.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
