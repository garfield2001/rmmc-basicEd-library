import { Button } from '@/components/ui/button';
import type { RosterPlacementPreview } from '@/types/enrollments';
import { router, useForm } from '@inertiajs/react';
import { ClipboardPaste, FileCheck2, MoveRight, TriangleAlert, UsersRound } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useEffect, useMemo, useState } from 'react';

interface EnrollmentActionsProps {
    selectedIds: number[];
    allMatchingSelected: boolean;
    schoolYearId: number;
    filters: {
        search: string;
        sourceSchoolYearId: number;
        sourceYearLevel: string;
        sourceSection: string;
        sourceMemberStatus: string;
    };
    yearLevels: string[];
    sectionsByYearLevel: Record<string, string[]>;
    hasDistinctSchoolYears: boolean;
}

interface PlacementForm {
    [key: string]: string | number | number[] | boolean | Record<string, string>;
    school_year_id: number;
    member_ids: number[];
    year_level: string;
    section: string;
    status: 'pending';
    select_all: boolean;
    filters: Record<string, string>;
}

type PlacementMode = 'selected' | 'paste';

export function EnrollmentActions({
    selectedIds,
    allMatchingSelected,
    schoolYearId,
    filters,
    yearLevels,
    sectionsByYearLevel,
    hasDistinctSchoolYears,
}: EnrollmentActionsProps) {
    const form = useForm<PlacementForm>({
        school_year_id: schoolYearId,
        member_ids: selectedIds,
        year_level: '',
        section: '',
        status: 'pending',
        select_all: false,
        filters: {},
    });
    const [mode, setMode] = useState<PlacementMode>('selected');
    const [pastedIds, setPastedIds] = useState('');
    const [preview, setPreview] = useState<RosterPlacementPreview | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [pasteYearLevel, setPasteYearLevel] = useState('');
    const [pasteSection, setPasteSection] = useState('');
    const actionFilters = {
        search: filters.search,
        source_school_year_id: String(filters.sourceSchoolYearId),
        source_year_level: filters.sourceYearLevel,
        source_section: filters.sourceSection,
        source_member_status: filters.sourceMemberStatus,
    };
    const selectedCountLabel = allMatchingSelected ? 'all matching source students' : `${selectedIds.length} selected`;
    const hasSelection = hasDistinctSchoolYears && (allMatchingSelected || selectedIds.length > 0);
    const targetYearLevels = useMemo(() => {
        const sourceIndex = levelIndex(filters.sourceYearLevel, yearLevels);

        return sourceIndex === -1 ? yearLevels : yearLevels.filter((_, index) => index >= sourceIndex);
    }, [filters.sourceYearLevel, yearLevels]);
    const sectionOptions = form.data.year_level ? (sectionsByYearLevel[form.data.year_level] ?? []) : [];
    const pasteSectionOptions = pasteYearLevel ? (sectionsByYearLevel[pasteYearLevel] ?? []) : [];

    useEffect(() => {
        form.setData('school_year_id', schoolYearId);
        form.setData('member_ids', selectedIds);
        form.setData('select_all', allMatchingSelected);
        form.setData('filters', actionFilters);
    }, [
        allMatchingSelected,
        schoolYearId,
        selectedIds,
        filters.search,
        filters.sourceSchoolYearId,
        filters.sourceYearLevel,
        filters.sourceSection,
        filters.sourceMemberStatus,
    ]);

    useEffect(() => {
        if (form.data.year_level && !targetYearLevels.includes(form.data.year_level)) {
            form.setData('year_level', '');
            form.setData('section', '');
        }
    }, [filters.sourceYearLevel, targetYearLevels]);

    useEffect(() => {
        setPreview(null);
        setPreviewError(null);
    }, [pastedIds, pasteYearLevel, pasteSection, schoolYearId, filters.sourceSchoolYearId, filters.sourceYearLevel]);

    useEffect(() => {
        if (pasteYearLevel && !targetYearLevels.includes(pasteYearLevel)) {
            setPasteYearLevel('');
            setPasteSection('');
            setPreview(null);
        }
    }, [pasteYearLevel, targetYearLevels]);

    const submitPlacement: FormEventHandler = (event) => {
        event.preventDefault();
        router.patch(
            '/admin/student-enrollments/bulk-assign',
            { ...form.data, member_ids: selectedIds, select_all: allMatchingSelected, filters: actionFilters, status: 'pending' },
            { preserveScroll: true },
        );
    };

    const previewRoster: FormEventHandler = async (event) => {
        event.preventDefault();

        if (!hasDistinctSchoolYears || !pastedIds.trim() || !pasteYearLevel) {
            return;
        }

        setIsPreviewing(true);
        setPreviewError(null);

        try {
            const response = await fetch('/admin/student-enrollments/preview-roster', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({
                    school_year_id: schoolYearId,
                    student_ids: pastedIds,
                    year_level: pasteYearLevel,
                    section: pasteSection,
                    filters: actionFilters,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                const message =
                    payload.message ??
                    Object.values(payload.errors ?? {})
                        .flat()
                        .join(' ') ??
                    'Unable to preview this roster.';
                setPreviewError(message);
                setPreview(null);
                return;
            }

            setPreview(payload.preview);
        } catch {
            setPreviewError('Unable to preview this roster right now.');
            setPreview(null);
        } finally {
            setIsPreviewing(false);
        }
    };

    const confirmRosterPlacement = () => {
        if (!preview || preview.memberIds.length === 0 || preview.demotionStudents.length > 0) {
            return;
        }

        router.patch(
            '/admin/student-enrollments/bulk-assign',
            {
                school_year_id: schoolYearId,
                member_ids: preview.memberIds,
                year_level: preview.targetYearLevel,
                section: preview.targetSection ?? '',
                status: 'pending',
                select_all: false,
                filters: actionFilters,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPreview(null);
                    setPastedIds('');
                },
            },
        );
    };

    return (
        <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#040DBF]/10 p-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Target placement tools</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[#020659]/70">
                        Place students by selecting rows or by pasting an official class list. Kindergarten is intentionally excluded for now.
                    </p>
                </div>
                <div className="grid rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-1 sm:grid-cols-2">
                    {[
                        { value: 'selected' as const, label: 'Selected rows', icon: UsersRound },
                        { value: 'paste' as const, label: 'Paste ID list', icon: ClipboardPaste },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = mode === item.value;

                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setMode(item.value)}
                                className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                                    isActive ? 'bg-white text-[#010440] shadow-sm' : 'text-[#030A8C] hover:text-[#010440]'
                                }`}
                            >
                                <Icon className="size-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {mode === 'selected' ? (
                <form onSubmit={submitPlacement} className="p-5">
                    <div className="flex flex-col gap-1">
                        <h3 className="font-semibold tracking-normal text-[#010440]">Assign selected students</h3>
                        <p className="text-sm text-[#020659]/70">
                            {hasDistinctSchoolYears
                                ? `${selectedCountLabel}. Choose the next year level and optionally assign a section.`
                                : 'Choose a different target school year before transferring students.'}
                        </p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <select
                            value={form.data.year_level}
                            onChange={(event) => {
                                form.setData('year_level', event.target.value);
                                form.setData('section', '');
                            }}
                            className={inputClass}
                        >
                            <option value="">Target year level</option>
                            {targetYearLevels.map((yearLevel) => (
                                <option key={yearLevel} value={yearLevel}>
                                    {yearLevel}
                                </option>
                            ))}
                        </select>
                        <input
                            list="target-section-options"
                            value={form.data.section}
                            onChange={(event) => form.setData('section', event.target.value)}
                            placeholder={form.data.year_level ? 'Target section optional' : 'Choose year level first'}
                            disabled={!form.data.year_level}
                            className={inputClass}
                        />
                        <datalist id="target-section-options">
                            {sectionOptions.map((section) => (
                                <option key={section} value={section} />
                            ))}
                        </datalist>
                        <Button type="submit" disabled={!hasSelection || !form.data.year_level} className="w-full md:w-auto">
                            <MoveRight className="size-4" />
                            Transfer
                        </Button>
                    </div>
                </form>
            ) : (
                <form onSubmit={previewRoster} className="grid gap-5 p-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1fr)]">
                    <div>
                        <h3 className="font-semibold tracking-normal text-[#010440]">Paste official student IDs</h3>
                        <p className="mt-1 text-sm leading-6 text-[#020659]/70">
                            Paste school IDs from Excel or a class list. The preview will show which IDs can be placed before anything is saved.
                        </p>
                        <textarea
                            value={pastedIds}
                            onChange={(event) => setPastedIds(event.target.value)}
                            placeholder={'2609010001\n2609010002\n2609010003'}
                            className="mt-4 min-h-52 w-full resize-y rounded-lg border border-[#040DBF]/15 bg-white p-3 text-sm leading-6 text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                        />
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <select
                                value={pasteYearLevel}
                                onChange={(event) => {
                                    setPasteYearLevel(event.target.value);
                                    setPasteSection('');
                                }}
                                className={inputClass}
                            >
                                <option value="">Target year level</option>
                                {targetYearLevels.map((yearLevel) => (
                                    <option key={yearLevel} value={yearLevel}>
                                        {yearLevel}
                                    </option>
                                ))}
                            </select>
                            <input
                                list="paste-target-section-options"
                                value={pasteSection}
                                onChange={(event) => setPasteSection(event.target.value)}
                                placeholder={pasteYearLevel ? 'Target section optional' : 'Choose year level first'}
                                disabled={!pasteYearLevel}
                                className={inputClass}
                            />
                            <datalist id="paste-target-section-options">
                                {pasteSectionOptions.map((section) => (
                                    <option key={section} value={section} />
                                ))}
                            </datalist>
                        </div>
                        <Button
                            type="submit"
                            disabled={!hasDistinctSchoolYears || !pastedIds.trim() || !pasteYearLevel || isPreviewing}
                            className="mt-4 w-full"
                        >
                            <FileCheck2 className="size-4" />
                            {isPreviewing ? 'Checking IDs...' : 'Preview placement'}
                        </Button>
                        {previewError && (
                            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{previewError}</p>
                        )}
                    </div>

                    <RosterPreviewPanel preview={preview} onConfirm={confirmRosterPlacement} />
                </form>
            )}
        </section>
    );
}

const inputClass =
    'h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60';

function levelIndex(yearLevel: string, yearLevels: string[]) {
    return yearLevels.findIndex((level) => level === yearLevel);
}

function RosterPreviewPanel({ preview, onConfirm }: { preview: RosterPlacementPreview | null; onConfirm: () => void }) {
    if (!preview) {
        return (
            <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-[#040DBF]/20 bg-[#f6f8ff]/70 p-6 text-center">
                <div>
                    <FileCheck2 className="mx-auto size-10 text-[#040DBF]" />
                    <p className="mt-3 font-semibold text-[#010440]">Preview appears here</p>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-[#020659]/70">
                        You will see matched students, missing IDs, duplicates, and placement warnings before confirming.
                    </p>
                </div>
            </div>
        );
    }

    const canConfirm = preview.memberIds.length > 0 && preview.demotionStudents.length === 0;

    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <PreviewMetric label="Matched" value={preview.matchedCount} />
                <PreviewMetric label="Missing" value={preview.notFoundIds.length} tone={preview.notFoundIds.length > 0 ? 'warning' : 'normal'} />
                <PreviewMetric label="Duplicates" value={preview.duplicateIds.length} tone={preview.duplicateIds.length > 0 ? 'warning' : 'normal'} />
            </div>

            <div className="mt-4 rounded-lg border border-[#040DBF]/10 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold text-[#010440]">
                            {preview.targetYearLevel}
                            {preview.targetSection ? ` - ${preview.targetSection}` : ''}
                        </p>
                        <p className="mt-1 text-sm text-[#020659]/70">
                            {preview.uniqueCount.toLocaleString()} unique IDs checked from {preview.inputCount.toLocaleString()} pasted entries.
                        </p>
                    </div>
                    <Button type="button" onClick={onConfirm} disabled={!canConfirm}>
                        <MoveRight className="size-4" />
                        Confirm placement
                    </Button>
                </div>
            </div>

            <PreviewList title="Matched students" students={preview.matchedStudents.slice(0, 8)} />
            <WarningList title="IDs not found" values={preview.notFoundIds} />
            <WarningList title="Duplicate pasted IDs" values={preview.duplicateIds} />
            <WarningStudents title="Already placed in target year" students={preview.alreadyPlaced} />
            <WarningStudents title="Inactive member profiles" students={preview.inactiveStudents} />
            <WarningStudents title="Target year is lower than source year" students={preview.demotionStudents} danger />
        </div>
    );
}

function PreviewMetric({ label, value, tone = 'normal' }: { label: string; value: number; tone?: 'normal' | 'warning' }) {
    return (
        <div
            className={`rounded-lg border p-3 ${tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-[#040DBF]/10 bg-white text-[#010440]'}`}
        >
            <p className="text-xs font-semibold tracking-[0.14em] uppercase">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
        </div>
    );
}

function PreviewList({ title, students }: { title: string; students: RosterPlacementPreview['matchedStudents'] }) {
    if (students.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 rounded-lg border border-[#040DBF]/10 bg-white">
            <p className="border-b border-[#040DBF]/10 px-4 py-3 text-sm font-semibold text-[#010440]">{title}</p>
            <div className="divide-y divide-[#040DBF]/10">
                {students.map((student) => (
                    <div key={student.id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                            <p className="font-medium text-[#010440]">{student.name}</p>
                            <p className="text-[#020659]/70">{student.schoolId}</p>
                        </div>
                        <p className="text-[#020659]/70">
                            {[student.sourceYearLevel, student.sourceSection].filter(Boolean).join(' - ') || 'No source placement'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function WarningList({ title, values }: { title: string; values: string[] }) {
    if (values.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
                <TriangleAlert className="size-4" />
                {title}
            </div>
            <p className="mt-2 break-words">{values.slice(0, 18).join(', ')}</p>
            {values.length > 18 && <p className="mt-1 font-medium">+{values.length - 18} more</p>}
        </div>
    );
}

function WarningStudents({
    title,
    students,
    danger = false,
}: {
    title: string;
    students: RosterPlacementPreview['matchedStudents'];
    danger?: boolean;
}) {
    if (students.length === 0) {
        return null;
    }

    return (
        <div
            className={`mt-4 rounded-lg border p-4 text-sm ${danger ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
        >
            <div className="flex items-center gap-2 font-semibold">
                <TriangleAlert className="size-4" />
                {title}
            </div>
            <p className="mt-2">
                {students
                    .slice(0, 8)
                    .map((student) => `${student.name} (${student.schoolId})`)
                    .join(', ')}
            </p>
            {students.length > 8 && <p className="mt-1 font-medium">+{students.length - 8} more</p>}
        </div>
    );
}
