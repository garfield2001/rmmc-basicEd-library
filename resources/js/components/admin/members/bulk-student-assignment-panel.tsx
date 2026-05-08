import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { csrfFetch } from '@/lib/http';
import type { StudentAssignmentPreview } from '@/types/members';
import { router } from '@inertiajs/react';
import { FileCheck2, MoveRight, TriangleAlert } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useEffect, useState } from 'react';

interface BulkStudentAssignmentPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAssigned: () => void;
}

export function BulkStudentAssignmentPanel({ open, onOpenChange, onAssigned }: BulkStudentAssignmentPanelProps) {
    const [studentIds, setStudentIds] = useState('');
    const [section, setSection] = useState('');
    const [preview, setPreview] = useState<StudentAssignmentPreview | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);

    useEffect(() => {
        setPreview(null);
        setPreviewError(null);
    }, [studentIds, section]);

    const previewStudents: FormEventHandler = async (event) => {
        event.preventDefault();

        if (!studentIds.trim()) {
            return;
        }

        setIsPreviewing(true);
        setPreviewError(null);

        try {
            const response = await csrfFetch('/admin/members/preview-student-assignment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_ids: studentIds,
                    section,
                }),
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                if (response.status === 419) {
                    setPreviewError('Your admin session token expired. Refresh the page, then try previewing the IDs again.');
                    return;
                }

                const message =
                    payload?.message ??
                    Object.values(payload?.errors ?? {})
                        .flat()
                        .join(' ') ??
                    'Unable to preview these student IDs.';
                setPreviewError(message);
                return;
            }

            setPreview(payload.preview);
        } catch {
            setPreviewError('Unable to preview these student IDs right now.');
        } finally {
            setIsPreviewing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                draggable={false}
                className="grid h-[min(42rem,calc(100dvh-1rem))] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-4 sm:max-w-6xl sm:p-6 xl:max-w-7xl"
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl text-zinc-950">Assign Student Sections</DialogTitle>
                    <DialogDescription>
                        Paste student IDs, review their active year level and section, then update only their section.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={previewStudents}
                    className="grid min-h-0 grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:grid-rows-none lg:gap-6"
                >
                    <div className="flex min-h-0 flex-col gap-3">
                        <textarea
                            value={studentIds}
                            onChange={(event) => setStudentIds(event.target.value)}
                            placeholder={'2609010001\n2609010002\n2609010003'}
                            className="min-h-0 flex-1 resize-none rounded-lg border border-zinc-300 bg-white p-3 text-sm leading-6 text-zinc-950 outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                        />
                        <div className="shrink-0 space-y-2">
                            <label htmlFor="bulk-member-section" className="text-sm font-medium text-zinc-700">
                                Assign section
                            </label>
                            <input
                                id="bulk-member-section"
                                value={section}
                                onChange={(event) => setSection(event.target.value)}
                                placeholder="Leave blank to clear section"
                                className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                            />
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                            <Button type="submit" disabled={!studentIds.trim() || isPreviewing} className="w-full sm:w-auto">
                                <FileCheck2 className="size-4" />
                                {isPreviewing ? 'Checking IDs...' : 'Preview IDs'}
                            </Button>
                        </div>
                        {previewError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{previewError}</p>}
                    </div>

                    <AssignmentPreview
                        preview={preview}
                        onConfirm={() => {
                            if (preview?.memberIds.length) {
                                router.patch(
                                    '/admin/members/bulk-assign-students',
                                    {
                                        member_ids: preview.memberIds,
                                        section,
                                    },
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setPreview(null);
                                            setStudentIds('');
                                            onOpenChange(false);
                                            onAssigned();
                                        },
                                    },
                                );
                            }
                        }}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AssignmentPreview({ preview, onConfirm }: { preview: StudentAssignmentPreview | null; onConfirm: () => void }) {
    if (!preview) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
                <div>
                    <FileCheck2 className="mx-auto size-10 text-[#040DBF]" />
                    <p className="mt-3 font-semibold text-zinc-950">Preview appears here</p>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                        Matched students, active year levels, sections, missing IDs, and duplicate pasted IDs are shown before saving.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:p-4">
            <div className="grid shrink-0 gap-2 sm:grid-cols-3">
                <PreviewMetric label="Matched" value={preview.matchedCount} />
                <PreviewMetric label="Missing" value={preview.notFoundIds.length} tone={preview.notFoundIds.length > 0 ? 'warning' : 'normal'} />
                <PreviewMetric label="Duplicates" value={preview.duplicateIds.length} tone={preview.duplicateIds.length > 0 ? 'warning' : 'normal'} />
            </div>

            <div className="mt-3 shrink-0 rounded-lg border border-zinc-200 bg-white p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold text-zinc-950">Assign section: {preview.targetSection || 'Clear section'}</p>
                        <p className="mt-1 text-sm text-zinc-500">
                            {preview.uniqueCount.toLocaleString()} unique IDs checked from {preview.inputCount.toLocaleString()} pasted entries.
                        </p>
                    </div>
                    <Button type="button" onClick={onConfirm} disabled={preview.memberIds.length === 0}>
                        <MoveRight className="size-4" />
                        Confirm assignment
                    </Button>
                </div>
            </div>

            <PreviewList students={preview.matchedStudents} />
            <div className="mt-3 grid shrink-0 gap-2 md:grid-cols-3">
                <WarningList title="IDs not found" values={preview.notFoundIds} />
                <WarningList title="Duplicate pasted IDs" values={preview.duplicateIds} />
                <WarningList title="Missing details" values={preview.incompleteDetailIds} />
            </div>
        </div>
    );
}

function PreviewMetric({ label, value, tone = 'normal' }: { label: string; value: number; tone?: 'normal' | 'warning' }) {
    return (
        <div
            className={`rounded-lg border p-2.5 ${tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-zinc-200 bg-white text-zinc-950'}`}
        >
            <p className="text-xs font-semibold tracking-[0.14em] uppercase">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value.toLocaleString()}</p>
        </div>
    );
}

function PreviewList({ students }: { students: StudentAssignmentPreview['matchedStudents'] }) {
    if (students.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <p className="border-b border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-950">Matched students</p>
            <div className="divide-y divide-zinc-200">
                {students.slice(0, 5).map((student) => {
                    const hasCompleteDetails = Boolean(student.currentYearLevel && student.currentSection);

                    return (
                        <div key={student.id} className="grid gap-2 px-3 py-2 text-sm md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-center">
                            <div>
                                <p className="font-medium text-zinc-950">{student.name}</p>
                                <p className="text-zinc-500">{student.schoolId}</p>
                            </div>
                            <PreviewDetail label="Year level" value={student.currentYearLevel} />
                            <PreviewDetail label="Section" value={student.currentSection} />
                            <span
                                className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                                    hasCompleteDetails ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                                }`}
                            >
                                {hasCompleteDetails ? 'Ready' : 'Needs details'}
                            </span>
                        </div>
                    );
                })}
            </div>
            {students.length > 5 && (
                <p className="border-t border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500">+{students.length - 5} more matched students</p>
            )}
        </div>
    );
}

function PreviewDetail({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-zinc-400 uppercase">{label}</p>
            <p className="mt-1 text-zinc-700">{value || '-'}</p>
        </div>
    );
}

function WarningList({ title, values }: { title: string; values: string[] }) {
    if (values.length === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
                <TriangleAlert className="size-4" />
                {title}
            </div>
            <p className="mt-2 break-words">{values.slice(0, 6).join(', ')}</p>
            {values.length > 6 && <p className="mt-1 font-medium">+{values.length - 6} more</p>}
        </div>
    );
}
