import type { VisitReportComparison } from '@/types/reports';
import { Target, Trophy } from 'lucide-react';
import type { VisitorType } from './report-helpers';

interface ReportAnalysisSummaryProps {
    comparison?: VisitReportComparison;
    visitorType: VisitorType;
}

export function ReportAnalysisSummary({ comparison, visitorType }: ReportAnalysisSummaryProps) {
    if (!comparison || (comparison.top_by_visits?.length ?? 0) < 2) {
        return null;
    }

    const groupLabel = visitorType === 'student' ? 'Section' : 'Department';

    return (
        <section className="space-y-4">
            <div>
                <h3 className="text-base font-semibold text-[#010440]">Comparative Analysis Summary</h3>
                <p className="text-xs text-[#020659]/70">
                    Performance breakdown and rankings across all active {groupLabel.toLowerCase()}s in this period.
                </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                {/* Ranking 1: Highest Total Visits */}
                <div className="admin-surface flex flex-col justify-between rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2.5 border-b border-[#040DBF]/10 pb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-[#010440]">Top {groupLabel}s by Total Visits</h4>
                                <p className="text-xs text-[#020659]/60">Ranked by total volume of visits recorded</p>
                            </div>
                        </div>

                        <div className="mt-4 divide-y divide-[#040DBF]/5">
                            {comparison.top_by_visits.slice(0, 5).map((item, index) => (
                                <div key={item.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                index === 0
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : index === 1
                                                      ? 'bg-slate-200 text-slate-700'
                                                      : index === 2
                                                        ? 'bg-amber-700/10 text-amber-900'
                                                        : 'bg-[#040DBF]/5 text-[#020659]/70'
                                            }`}
                                        >
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-[#010440]">{item.label}</p>
                                            <p className="text-xs text-[#020659]/60">
                                                {item.average_visits} avg / member • {item.visitors} visitors
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#040DBF]">{item.total_visits} visits</p>
                                        <p className="text-xs font-medium text-[#020659]/60">{item.visit_share_percent}% share</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ranking 2: Highest Target Completion Rate */}
                <div className="admin-surface flex flex-col justify-between rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2.5 border-b border-[#040DBF]/10 pb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-[#010440]">Top {groupLabel}s by Target Completion</h4>
                                <p className="text-xs text-[#020659]/60">Ranked by % of members meeting target visits</p>
                            </div>
                        </div>

                        <div className="mt-4 divide-y divide-[#040DBF]/5">
                            {comparison.top_by_completion.slice(0, 5).map((item, index) => (
                                <div key={item.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                index === 0
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : index === 1
                                                      ? 'bg-slate-200 text-slate-700'
                                                      : index === 2
                                                        ? 'bg-amber-700/10 text-amber-900'
                                                        : 'bg-[#040DBF]/5 text-[#020659]/70'
                                            }`}
                                        >
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-[#010440]">{item.label}</p>
                                            <p className="text-xs text-[#020659]/60">
                                                {item.met_required} of {item.visitors} met quota
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-600">{item.completion_percent}%</p>
                                        <p className="text-xs font-medium text-[#020659]/60">{item.average_visits} avg visits</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
