import { Trophy, Medal, Award } from 'lucide-react';

interface SectionLeaderboardProps {
    sections: Array<{ label: string; value: number }>;
}

export function SectionLeaderboardCard({ sections }: SectionLeaderboardProps) {
    const topSections = sections.slice(0, 5);
    const maxVisits = topSections[0]?.value ?? 1;

    const rankBadge = (index: number) => {
        if (index === 0) {
            return (
                <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                    <Trophy className="size-4" />
                </span>
            );
        }
        if (index === 1) {
            return (
                <span className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Medal className="size-4" />
                </span>
            );
        }
        if (index === 2) {
            return (
                <span className="flex size-7 items-center justify-center rounded-full bg-orange-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-500">
                    <Award className="size-4" />
                </span>
            );
        }
        return (
            <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                #{index + 1}
            </span>
        );
    };

    return (
        <section className="admin-surface flex h-full flex-col rounded-xl border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-[#040DBF]/10 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        <Trophy className="size-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-bold text-[#010440] dark:text-white">Top Sections Leaderboard</h3>
                        <p className="text-[11px] text-[#030A8C] dark:text-slate-400">Most active classes by visit volume</p>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex-1 space-y-3">
                {topSections.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-xs text-slate-400">
                        No section visits recorded yet.
                    </div>
                ) : (
                    topSections.map((item, index) => {
                        const percent = Math.round((item.value / maxVisits) * 100);
                        return (
                            <div key={item.label} className="group relative rounded-lg border border-[#040DBF]/5 bg-[#f6f8ff]/50 p-2.5 transition hover:border-[#040DBF]/20 hover:bg-[#f6f8ff] dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {rankBadge(index)}
                                        <span className="font-bold text-[#010440] dark:text-white truncate">
                                            {item.label}
                                        </span>
                                    </div>
                                    <span className="font-semibold text-[#040DBF] dark:text-sky-400 shrink-0 ml-2">
                                        {item.value.toLocaleString()} visits
                                    </span>
                                </div>
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            index === 0
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                                : index === 1
                                                  ? 'bg-gradient-to-r from-slate-400 to-slate-500'
                                                  : index === 2
                                                    ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                        }`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
