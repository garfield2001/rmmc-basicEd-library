import type { IndividualProgressPoint, RequiredProgressPoint } from '@/types/dashboard';
import { BriefcaseBusiness, CheckCircle2, Clock, GraduationCap, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyChartState } from './empty-chart-state';

interface RequiredProgressPanelProps {
    progress: RequiredProgressPoint[];
    individualProgress?: IndividualProgressPoint[];
    framed?: boolean;
}

export function RequiredProgressPanel({ progress, individualProgress = [], framed = true }: RequiredProgressPanelProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'students' | 'employees'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'met' | 'pending'>('all');

    const filteredIndividuals = useMemo(() => {
        return individualProgress.filter((item) => {
            if (activeTab === 'students' && item.type !== 'student') return false;
            if (activeTab === 'employees' && item.type !== 'employee') return false;

            const isMet = item.visits >= item.required;
            if (filterStatus === 'met' && !isMet) return false;
            if (filterStatus === 'pending' && isMet) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                item.name.toLowerCase().includes(q) ||
                (item.schoolId && item.schoolId.toLowerCase().includes(q)) ||
                item.group.toLowerCase().includes(q)
            );
        });
    }, [individualProgress, activeTab, filterStatus, searchQuery]);

    const content = (
        <div className="space-y-6">
            {progress.length > 0 ? (
                <>
                    {/* Summary Cohort Cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {progress.map((item) => {
                            const Icon = item.label === 'Students' ? GraduationCap : BriefcaseBusiness;
                            const completionRate = item.visitors > 0 ? Math.round((item.met_required / item.visitors) * 100) : 0;

                            return (
                                <article
                                    key={item.label}
                                    className="rounded-xl border border-[#040DBF]/10 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex size-7 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF] dark:bg-sky-500/20 dark:text-sky-300">
                                                <Icon className="size-4" />
                                            </span>
                                            <h3 className="font-bold text-[#010440] dark:text-white">{item.label}</h3>
                                        </div>
                                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#040DBF] dark:bg-blue-950/60 dark:text-blue-300">
                                            Quota: {item.required} visits
                                        </span>
                                    </div>

                                    {/* Primary Completion Rate */}
                                    <div className="mt-4 flex items-baseline justify-between">
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                                Quota Completion Rate
                                            </p>
                                            <p className="mt-0.5 text-2xl font-extrabold text-[#010440] dark:text-white">{completionRate}%</p>
                                        </div>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                            <span className="font-bold text-[#010440] dark:text-white">{item.met_required.toLocaleString()}</span> of{' '}
                                            {item.visitors.toLocaleString()} reached target
                                        </p>
                                    </div>

                                    {/* Dual Progress Bars */}
                                    <div className="mt-3 space-y-2">
                                        <div>
                                            <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                <span>Target Met ({completionRate}%)</span>
                                                <span>{item.visitors - item.met_required} pending</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                                    style={{ width: `${completionRate}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                <span>Volume Progress ({item.percent}%)</span>
                                                <span>
                                                    {item.visits.toLocaleString()} / {item.required_total.toLocaleString()} scans
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-[#040DBF] transition-all duration-300 dark:bg-blue-500"
                                                    style={{ width: `${item.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* Interactive Individual Student & Employee Roster Search */}
                    {individualProgress.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-[#010440] dark:text-white">Individual Attendance Breakdown</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Inspect and search remaining visits per student or employee
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Audience Filter */}
                                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-800 dark:bg-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('all')}
                                            className={`rounded-md px-2.5 py-1 font-medium transition ${
                                                activeTab === 'all'
                                                    ? 'bg-white text-[#010440] shadow-xs dark:bg-slate-700 dark:text-white'
                                                    : 'text-slate-600 hover:text-black dark:text-slate-300'
                                            }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('students')}
                                            className={`rounded-md px-2.5 py-1 font-medium transition ${
                                                activeTab === 'students'
                                                    ? 'bg-white text-[#010440] shadow-xs dark:bg-slate-700 dark:text-white'
                                                    : 'text-slate-600 hover:text-black dark:text-slate-300'
                                            }`}
                                        >
                                            Students
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('employees')}
                                            className={`rounded-md px-2.5 py-1 font-medium transition ${
                                                activeTab === 'employees'
                                                    ? 'bg-white text-[#010440] shadow-xs dark:bg-slate-700 dark:text-white'
                                                    : 'text-slate-600 hover:text-black dark:text-slate-300'
                                            }`}
                                        >
                                            Employees
                                        </button>
                                    </div>

                                    {/* Status Filter */}
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'met' | 'pending')}
                                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="pending">Pending quota</option>
                                        <option value="met">Quota met</option>
                                    </select>
                                </div>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute top-2.5 left-3 size-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID number, grade, or department..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-xs text-[#010440] placeholder-slate-400 focus:border-[#040DBF] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            {/* Results Table */}
                            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                                        <tr>
                                            <th className="px-3 py-2">Member</th>
                                            <th className="px-3 py-2">Class / Dept</th>
                                            <th className="px-3 py-2 text-center">Visits</th>
                                            <th className="px-3 py-2 text-center">Required</th>
                                            <th className="px-3 py-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {filteredIndividuals.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-6 text-center text-slate-400">
                                                    No matching members found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredIndividuals.slice(0, 100).map((member) => {
                                                const isMet = member.visits >= member.required;

                                                return (
                                                    <tr
                                                        key={`${member.type}-${member.id}`}
                                                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                                                    >
                                                        <td className="px-3 py-2 font-medium text-[#010440] dark:text-white">
                                                            <div>{member.name}</div>
                                                            {member.schoolId && <div className="text-[10px] text-slate-400">{member.schoolId}</div>}
                                                        </td>
                                                        <td className="max-w-[140px] truncate px-3 py-2 text-slate-500 dark:text-slate-400">
                                                            {member.group}
                                                        </td>
                                                        <td className="px-3 py-2 text-center font-bold text-[#010440] dark:text-white">
                                                            {member.visits}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-slate-500 dark:text-slate-400">
                                                            {member.required}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            {isMet ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                                    <CheckCircle2 className="size-3" />
                                                                    Met
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                                                    <Clock className="size-3" />
                                                                    {member.remaining} left
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {filteredIndividuals.length > 100 && (
                                <p className="text-right text-[11px] text-slate-400">
                                    Showing top 100 of {filteredIndividuals.length.toLocaleString()} matching records.
                                </p>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <EmptyChartState message="Configure an active school year to calculate required visit progress." />
            )}
        </div>
    );

    if (!framed) {
        return <div>{content}</div>;
    }

    return <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">{content}</section>;
}
