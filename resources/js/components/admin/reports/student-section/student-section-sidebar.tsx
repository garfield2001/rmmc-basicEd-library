import { SelectInput } from '@/components/ui/select-input';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Search, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DepartmentTab, SectionAggregate, SectionSortMode } from './student-section-types';

interface StudentSectionSidebarProps {
    sections: SectionAggregate[];
    activeSectionKey: string | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelectSection: (key: string) => void;
}

const gradeLevelRank = (label: string): number => {
    const l = label.toLowerCase();
    if (l.includes('kinder 1')) return 1;
    if (l.includes('kinder 2') || l.includes('kinder')) return 2;
    if (l.includes('grade 10')) return 12;
    const match = l.match(/grade\s*(\d+)/);
    if (match) return Number(match[1]) + 2;
    return 99;
};

export function StudentSectionSidebar({ sections, activeSectionKey, searchQuery, onSearchChange, onSelectSection }: StudentSectionSidebarProps) {
    const [sortMode, setSortMode] = useState<SectionSortMode>('visits_desc');
    const [departmentTab, setDepartmentTab] = useState<DepartmentTab>('all');

    const departmentCounts = useMemo(() => {
        const preschool = sections.filter((s) => s.department === 'preschool').length;
        const elementary = sections.filter((s) => s.department === 'elementary').length;
        const jhs = sections.filter((s) => s.department === 'jhs').length;
        return { all: sections.length, preschool, elementary, jhs };
    }, [sections]);

    const filteredSections = useMemo(() => {
        let list = sections;

        if (departmentTab !== 'all') {
            list = list.filter((sec) => sec.department === departmentTab);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (sec) =>
                    sec.label.toLowerCase().includes(q) ||
                    sec.yearLevel.toLowerCase().includes(q) ||
                    sec.sectionName.toLowerCase().includes(q) ||
                    sec.students.some((st) => (st.name || '').toLowerCase().includes(q)),
            );
        }

        return [...list].sort((a, b) => {
            if (sortMode === 'grade_asc') {
                const rankDiff = gradeLevelRank(a.yearLevel) - gradeLevelRank(b.yearLevel);
                return rankDiff !== 0 ? rankDiff : a.label.localeCompare(b.label);
            }
            if (sortMode === 'completion_desc') {
                return b.completionPercent - a.completionPercent || b.totalVisits - a.totalVisits;
            }
            if (sortMode === 'completion_asc') {
                return a.completionPercent - b.completionPercent || a.totalVisits - b.totalVisits;
            }
            return b.totalVisits - a.totalVisits || a.label.localeCompare(b.label);
        });
    }, [sections, departmentTab, searchQuery, sortMode]);

    return (
        <aside className="flex w-full flex-col border-b border-[#040DBF]/10 bg-[#f8faff] md:w-80 md:border-r md:border-b-0 lg:w-96">
            {/* Header: Department Tabs (All, Pre-school, Elem, JHS) */}
            <div className="space-y-2.5 border-b border-[#040DBF]/10 bg-white p-3">
                <div className="grid grid-cols-4 gap-1 rounded-lg border border-[#040DBF]/10 bg-[#f8faff] p-1 text-[11px] font-semibold">
                    <button
                        type="button"
                        onClick={() => setDepartmentTab('all')}
                        className={cn(
                            'truncate rounded-md px-0.5 py-1 text-center transition-all',
                            departmentTab === 'all'
                                ? 'bg-white text-[#040DBF] shadow-xs ring-1 ring-[#040DBF]/15'
                                : 'text-[#020659]/70 hover:text-[#010440]',
                        )}
                    >
                        All ({departmentCounts.all})
                    </button>
                    <button
                        type="button"
                        onClick={() => setDepartmentTab('preschool')}
                        className={cn(
                            'truncate rounded-md px-0.5 py-1 text-center transition-all',
                            departmentTab === 'preschool'
                                ? 'bg-white text-[#040DBF] shadow-xs ring-1 ring-[#040DBF]/15'
                                : 'text-[#020659]/70 hover:text-[#010440]',
                        )}
                        title={`Pre-school (${departmentCounts.preschool})`}
                    >
                        Pre-school ({departmentCounts.preschool})
                    </button>
                    <button
                        type="button"
                        onClick={() => setDepartmentTab('elementary')}
                        className={cn(
                            'truncate rounded-md px-0.5 py-1 text-center transition-all',
                            departmentTab === 'elementary'
                                ? 'bg-white text-[#040DBF] shadow-xs ring-1 ring-[#040DBF]/15'
                                : 'text-[#020659]/70 hover:text-[#010440]',
                        )}
                        title={`Elementary (${departmentCounts.elementary})`}
                    >
                        Elem ({departmentCounts.elementary})
                    </button>
                    <button
                        type="button"
                        onClick={() => setDepartmentTab('jhs')}
                        className={cn(
                            'truncate rounded-md px-0.5 py-1 text-center transition-all',
                            departmentTab === 'jhs'
                                ? 'bg-white text-[#040DBF] shadow-xs ring-1 ring-[#040DBF]/15'
                                : 'text-[#020659]/70 hover:text-[#010440]',
                        )}
                        title={`Junior High (${departmentCounts.jhs})`}
                    >
                        JHS ({departmentCounts.jhs})
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#020659]/50" />
                    <input
                        type="text"
                        placeholder="Search sections or grades..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full rounded-lg border border-[#040DBF]/15 bg-[#f8faff] py-1.5 pr-3 pl-9 text-xs text-[#010440] placeholder:text-[#020659]/40 focus:border-[#040DBF] focus:bg-white focus:ring-1 focus:ring-[#040DBF] focus:outline-none"
                    />
                </div>

                {/* Sort Bar */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-[#020659]/70">
                    <div className="flex items-center gap-1 font-medium">
                        <ArrowUpDown className="size-3 text-[#040DBF]" />
                        <span>Sort:</span>
                    </div>
                    <SelectInput
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as SectionSortMode)}
                        className="h-7 py-0 pr-6 pl-2 text-[11px] font-medium"
                    >
                        <option value="visits_desc">Highest Visits</option>
                        <option value="grade_asc">Grade Level</option>
                        <option value="completion_desc">Target Met %</option>
                        <option value="completion_asc">Lowest Attendance</option>
                    </SelectInput>
                </div>
            </div>

            {/* Sections List */}
            <div className="max-h-[440px] flex-1 space-y-1.5 overflow-y-auto p-2 md:max-h-[620px]">
                {filteredSections.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#020659]/50">No sections found in this category</div>
                ) : (
                    filteredSections.map((sec, idx) => {
                        const isSelected = activeSectionKey === sec.key;

                        return (
                            <button
                                key={sec.key}
                                type="button"
                                onClick={() => onSelectSection(sec.key)}
                                className={cn(
                                    'relative w-full rounded-xl border p-3 text-left transition-all duration-150',
                                    isSelected
                                        ? 'border-[#040DBF] bg-white shadow-md ring-1 shadow-[#040DBF]/10 ring-[#040DBF]'
                                        : 'border-[#040DBF]/10 bg-white/70 shadow-xs hover:border-[#040DBF]/25 hover:bg-white',
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#040DBF]/5 text-[10px] font-bold text-[#010440]">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-[#010440]">{sec.label}</p>
                                            <p className="text-[11px] text-[#020659]/60">
                                                {sec.studentCount} students • {sec.averageVisits} avg
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className="inline-block rounded-md bg-[#040DBF]/10 px-2 py-0.5 text-xs font-bold text-[#040DBF]">
                                            {sec.totalVisits} visits
                                        </span>
                                        <p className="mt-0.5 text-[10px] font-medium text-[#020659]/75">{sec.completionPercent}% met quota</p>
                                    </div>
                                </div>

                                {sec.topStudent && sec.topStudent.visit_count > 0 && (
                                    <div className="mt-2 flex items-center gap-1.5 rounded-md border border-[#040DBF]/5 bg-[#f6f8ff] px-2 py-1 text-[11px] text-[#020659]/80">
                                        <User className="size-3 shrink-0 text-[#040DBF]" />
                                        <span className="truncate">
                                            <span className="font-semibold text-[#010440]">Top:</span> {sec.topStudent.name} (
                                            {sec.topStudent.visit_count} visits)
                                        </span>
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </aside>
    );
}
