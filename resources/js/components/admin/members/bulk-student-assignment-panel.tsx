import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SelectInput } from '@/components/ui/select-input';
import { csrfFetch } from '@/lib/http';
import type { StudentAssignmentPreview } from '@/types/members';
import { router } from '@inertiajs/react';
import { FileCheck2, MoveRight, TriangleAlert } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useEffect, useState } from 'react';

interface BulkStudentAssignmentPanelProps {
    open: boolean;
    selectedIds: number[];
    yearLevels: string[];
    sectionsByYearLevel: Record<string, string[]>;
    onOpenChange: (open: boolean) => void;
    onAssigned: () => void;
}

export function BulkStudentAssignmentPanel({
    open,
    selectedIds,
    yearLevels,
    sectionsByYearLevel,
    onOpenChange,
    onAssigned,
}: BulkStudentAssignmentPanelProps) {
    const [studentIds, setStudentIds] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [section, setSection] = useState('');
    const [preview, setPreview] = useState<StudentAssignmentPreview | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const sectionOptions = yearLevel ? (sectionsByYearLevel[yearLevel] ?? []) : [];

    useEffect(() => {
        setPreview(null);
        setPreviewError(null);
    }, [studentIds, yearLevel, section]);

    const previewStudents: FormEventHandler = async (event) => {
        event.preventDefault();

        if (!studentIds.trim() || !yearLevel) {
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
                    year_level: yearLevel,
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

    const assignStudents = (memberIds: number[]) => {
        if (memberIds.length === 0 || !yearLevel) {
            return;
        }

        router.patch(
            '/admin/members/bulk-assign-students',
            {
                member_ids: memberIds,
                year_level: yearLevel,
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
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-1rem)] min-h-[min(48rem,calc(100vh-1rem))] overflow-y-auto sm:max-w-6xl xl:max-w-7xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-zinc-950">Assign Student Year and Section</DialogTitle>
                    <DialogDescription>
                        Paste student IDs or use selected student rows, then update their active school-year details.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={previewStudents} className="grid flex-1 gap-6 xl:grid-cols-[minmax(380px,0.85fr)_minmax(0,1fr)]">
                    <div>
                        <textarea
                            value={studentIds}
                            onChange={(event) => setStudentIds(event.target.value)}
                            placeholder={'2609010001\n2609010002\n2609010003'}
                            className="min-h-72 w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm leading-6 text-zinc-950 outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                        />
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <SelectInput
                                value={yearLevel}
                                onChange={(event) => {
                                    setYearLevel(event.target.value);
                                    setSection('');
                                }}
                                className="border-zinc-300 text-zinc-700 focus:border-zinc-500 focus:ring-zinc-100"
                            >
                                <option value="">Year level</option>
                                {yearLevels.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </SelectInput>
                            <input
                                list="bulk-member-section-options"
                                value={section}
                                onChange={(event) => setSection(event.target.value)}
                                placeholder={yearLevel ? 'Section optional' : 'Choose year level first'}
                                disabled={!yearLevel}
                                className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            <datalist id="bulk-member-section-options">
                                {sectionOptions.map((option) => (
                                    <option key={option} value={option} />
                                ))}
                            </datalist>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Button type="submit" disabled={!studentIds.trim() || !yearLevel || isPreviewing} className="w-full sm:w-auto">
                                <FileCheck2 className="size-4" />
                                {isPreviewing ? 'Checking IDs...' : 'Preview IDs'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={selectedIds.length === 0 || !yearLevel}
                                onClick={() => assignStudents(selectedIds)}
                                className="w-full sm:w-auto"
                            >
                                <MoveRight className="size-4" />
                                Assign selected rows
                            </Button>
                        </div>
                        {previewError && (
                            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{previewError}</p>
                        )}
                    </div>

                    <AssignmentPreview preview={preview} onConfirm={() => assignStudents(preview?.memberIds ?? [])} />
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AssignmentPreview({ preview, onConfirm }: { preview: StudentAssignmentPreview | null; onConfirm: () => void }) {
    if (!preview) {
        return (
            <div className="flex min-h-96 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
                <div>
                    <FileCheck2 className="mx-auto size-10 text-[#040DBF]" />
                    <p className="mt-3 font-semibold text-zinc-950">Preview appears here</p>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                        Matched students, missing IDs, and duplicate pasted IDs are shown before saving.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <PreviewMetric label="Matched" value={preview.matchedCount} />
                <PreviewMetric label="Missing" value={preview.notFoundIds.length} tone={preview.notFoundIds.length > 0 ? 'warning' : 'normal'} />
                <PreviewMetric label="Duplicates" value={preview.duplicateIds.length} tone={preview.duplicateIds.length > 0 ? 'warning' : 'normal'} />
            </div>

            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold text-zinc-950">
                            {preview.yearLevel}
                            {preview.section ? ` - ${preview.section}` : ''}
                        </p>
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
            <WarningList title="IDs not found" values={preview.notFoundIds} />
            <WarningList title="Duplicate pasted IDs" values={preview.duplicateIds} />
        </div>
    );
}

function PreviewMetric({ label, value, tone = 'normal' }: { label: string; value: number; tone?: 'normal' | 'warning' }) {
    return (
        <div
            className={`rounded-lg border p-3 ${tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-zinc-200 bg-white text-zinc-950'}`}
        >
            <p className="text-xs font-semibold tracking-[0.14em] uppercase">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
        </div>
    );
}

function PreviewList({ students }: { students: StudentAssignmentPreview['matchedStudents'] }) {
    if (students.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white">
            <p className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-950">Matched students</p>
            <div className="divide-y divide-zinc-200">
                {students.slice(0, 8).map((student) => (
                    <div key={student.id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                            <p className="font-medium text-zinc-950">{student.name}</p>
                            <p className="text-zinc-500">{student.schoolId}</p>
                        </div>
                        <p className="text-zinc-500">
                            {[student.currentYearLevel, student.currentSection].filter(Boolean).join(' - ') || 'No active school-year details'}
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
