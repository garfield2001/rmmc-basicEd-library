import { Button } from '@/components/ui/button';
import { DateInput, formatDisplayDate } from '@/components/ui/date-input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SchoolYearRow } from '@/types/school-year';
import type { SharedData } from '@/types/shared';
import { useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CalendarClock, CheckCircle2, Pencil, Plus, Save } from 'lucide-react';
import type React from 'react';
import type { FormEventHandler } from 'react';
import { useEffect, useMemo, useState } from 'react';

interface SchoolYearForm {
    [key: string]: string | number | boolean;
    starts_at: string;
    ends_at: string;
    student_required_visits: number;
    employee_required_visits: number;
    transfer_employees: boolean;
    confirmed_transition: boolean;
}

const emptySchoolYearForm: SchoolYearForm = {
    starts_at: '',
    ends_at: '',
    student_required_visits: 4,
    employee_required_visits: 4,
    transfer_employees: false,
    confirmed_transition: false,
};

export function SchoolYearNavbarControl() {
    const { schoolYear, schoolYears } = usePage<SharedData>().props;
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    return (
        <>
            {previewOpen && !detailsOpen && (
                <div className="pointer-events-none fixed inset-0 z-[45] bg-[#010440]/10 backdrop-blur-[3px] transition" aria-hidden="true" />
            )}

            <div
                className="group relative z-[50]"
                onMouseEnter={() => setPreviewOpen(true)}
                onMouseLeave={() => setPreviewOpen(false)}
                onFocus={() => setPreviewOpen(true)}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        setPreviewOpen(false);
                    }
                }}
            >
                <button
                    type="button"
                    onClick={() => {
                        setPreviewOpen(false);
                        setDetailsOpen(true);
                    }}
                    className="admin-school-year-badge inline-flex h-9 items-center overflow-hidden rounded-full border border-[#040DBF]/10 bg-white text-xs shadow-sm transition hover:border-[#040DBF]/25 hover:shadow-md hover:shadow-[#040DBF]/10"
                >
                    <span className="admin-school-year-label border-r border-[#040DBF]/10 bg-[#f6f8ff] px-3 font-medium text-[#030A8C]">
                        School year
                    </span>
                    <span className="admin-school-year-value px-3 font-semibold text-[#010440]">{schoolYear?.name ?? 'Not configured'}</span>
                </button>

                <div className="pointer-events-none absolute top-full right-0 z-[60] w-80 pt-2 opacity-0 transition group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
                    <div className="admin-school-year-popover rounded-lg border border-[#040DBF]/10 bg-white p-4 text-sm shadow-xl shadow-[#040DBF]/10">
                        <div className="flex items-start gap-3">
                            <span className="admin-school-year-popover-icon flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f6f8ff] text-[#040DBF]">
                                <CalendarClock className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="font-semibold text-[#010440]">{schoolYear?.name ?? 'No active school year'}</p>
                                <p className="mt-1 text-xs leading-5 text-[#020659]/70">
                                    {schoolYear
                                        ? `${formatDisplayDate(schoolYear.starts_at)} to ${formatDisplayDate(schoolYear.ends_at)}`
                                        : 'Add a school year before logging student visits.'}
                                </p>
                            </div>
                        </div>
                        {schoolYear && (
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <MiniStat label="Students" value={schoolYear.student_required_visits} />
                                <MiniStat label="Employees" value={schoolYear.employee_required_visits} />
                            </div>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            className="mt-4 w-full"
                            onClick={() => {
                                setPreviewOpen(false);
                                setDetailsOpen(true);
                            }}
                        >
                            More details
                        </Button>
                    </div>
                </div>
            </div>

            <SchoolYearDetailsDialog open={detailsOpen} schoolYears={schoolYears} onOpenChange={setDetailsOpen} />
        </>
    );
}

function SchoolYearDetailsDialog({
    open,
    schoolYears,
    onOpenChange,
}: {
    open: boolean;
    schoolYears: SchoolYearRow[];
    onOpenChange: (open: boolean) => void;
}) {
    const activeSchoolYear = useMemo(() => schoolYears.find((schoolYear) => schoolYear.is_active) ?? null, [schoolYears]);
    const [editingSchoolYearId, setEditingSchoolYearId] = useState<number | null>(null);
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm<SchoolYearForm>({
        ...emptySchoolYearForm,
        student_required_visits: activeSchoolYear?.student_required_visits ?? emptySchoolYearForm.student_required_visits,
        employee_required_visits: activeSchoolYear?.employee_required_visits ?? emptySchoolYearForm.employee_required_visits,
    });
    const editingSchoolYear = schoolYears.find((schoolYear) => schoolYear.id === editingSchoolYearId) ?? null;
    const transitionYearStart = new Date().getFullYear();
    const transitionYearEnd = transitionYearStart + 5;

    useEffect(() => {
        if (open && !editingSchoolYearId) {
            setData({
                ...emptySchoolYearForm,
                student_required_visits: activeSchoolYear?.student_required_visits ?? emptySchoolYearForm.student_required_visits,
                employee_required_visits: activeSchoolYear?.employee_required_visits ?? emptySchoolYearForm.employee_required_visits,
                transfer_employees: false,
            });
            clearErrors();
        }
    }, [activeSchoolYear, clearErrors, editingSchoolYearId, open, setData]);

    const beginCreate = () => {
        setEditingSchoolYearId(null);
        reset();
        setData({
            ...emptySchoolYearForm,
            student_required_visits: activeSchoolYear?.student_required_visits ?? emptySchoolYearForm.student_required_visits,
            employee_required_visits: activeSchoolYear?.employee_required_visits ?? emptySchoolYearForm.employee_required_visits,
            transfer_employees: false,
        });
        clearErrors();
    };

    const beginEdit = (schoolYear: SchoolYearRow) => {
        if (!schoolYear.is_active) {
            return;
        }

        setEditingSchoolYearId(schoolYear.id);
        setData({
            starts_at: schoolYear.starts_at,
            ends_at: schoolYear.ends_at,
            student_required_visits: schoolYear.student_required_visits,
            employee_required_visits: schoolYear.employee_required_visits,
            transfer_employees: false,
            confirmed_transition: false,
        });
        clearErrors();
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                if (!editingSchoolYearId) {
                    beginCreate();
                }
            },
        };

        if (editingSchoolYearId) {
            patch(`/admin/school-years/${editingSchoolYearId}`, options);
            return;
        }

        post('/admin/school-years', options);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl text-[#010440]">School year details</DialogTitle>
                    <DialogDescription>Transition to the next school year, review historical years, and edit visit targets.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
                    <form onSubmit={submit} className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-[#010440]">
                                    {editingSchoolYear ? 'Edit school year' : 'Transition to new school year'}
                                </h3>
                                <p className="text-sm text-[#020659]/70">
                                    {editingSchoolYear
                                        ? editingSchoolYear.name
                                        : 'The name is generated from the start and end year, and this action cannot be reverted.'}
                                </p>
                            </div>
                            {editingSchoolYear && (
                                <Button type="button" variant="outline" size="sm" onClick={beginCreate}>
                                    <Plus className="size-4" />
                                    New
                                </Button>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Start" error={errors.starts_at}>
                                <DateInput
                                    value={data.starts_at}
                                    onChange={(value) => setData('starts_at', value)}
                                    className="mt-2"
                                    openOnFocus={false}
                                    yearWindowStart={editingSchoolYear ? undefined : transitionYearStart}
                                    yearWindowEnd={editingSchoolYear ? undefined : transitionYearEnd}
                                />
                            </Field>
                            <Field label="End" error={errors.ends_at}>
                                <DateInput
                                    value={data.ends_at}
                                    onChange={(value) => setData('ends_at', value)}
                                    className="mt-2"
                                    openOnFocus={false}
                                    yearWindowStart={editingSchoolYear ? undefined : transitionYearStart}
                                    yearWindowEnd={editingSchoolYear ? undefined : transitionYearEnd}
                                />
                            </Field>
                            <Field label="Required student visits" error={errors.student_required_visits}>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.student_required_visits}
                                    onChange={(event) => setData('student_required_visits', Number(event.target.value))}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Required employee visits" error={errors.employee_required_visits}>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.employee_required_visits}
                                    onChange={(event) => setData('employee_required_visits', Number(event.target.value))}
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        {!editingSchoolYear && (
                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <div className="flex gap-2">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                    <p>
                                        Creating this school year makes it active and starts with no students or employees unless you transfer
                                        employee profiles below. Previous visits remain available in Reports.
                                    </p>
                                </div>
                                <label className="mt-3 flex items-center gap-2 font-medium">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(data.transfer_employees)}
                                        onChange={(event) => setData('transfer_employees', event.target.checked)}
                                        className="size-4 rounded border-amber-300"
                                    />
                                    Transfer employee profiles from the previous school year.
                                </label>
                                <label className="mt-3 flex items-center gap-2 font-medium">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(data.confirmed_transition)}
                                        onChange={(event) => setData('confirmed_transition', event.target.checked)}
                                        className="size-4 rounded border-amber-300"
                                    />
                                    I understand this is a one-way school-year transition.
                                </label>
                            </div>
                        )}

                        <DialogFooter className="mt-5">
                            <Button type="submit" disabled={processing || (!editingSchoolYear && !data.confirmed_transition)}>
                                {editingSchoolYear ? <Save className="size-4" /> : <Plus className="size-4" />}
                                {processing ? 'Saving...' : editingSchoolYear ? 'Save changes' : 'Transition school year'}
                            </Button>
                        </DialogFooter>
                    </form>

                    <div className="max-h-[min(31rem,calc(100vh-13rem))] space-y-3 overflow-y-auto pr-1">
                        {schoolYears.length > 0 ? (
                            schoolYears.map((schoolYear) => (
                                <div key={schoolYear.id} className="rounded-lg border border-[#040DBF]/10 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-[#010440]">{schoolYear.name}</p>
                                                {schoolYear.is_active && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                                        <CheckCircle2 className="size-3.5" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-[#020659]/70">
                                                {formatDisplayDate(schoolYear.starts_at)} to {formatDisplayDate(schoolYear.ends_at)}
                                            </p>
                                        </div>
                                        {schoolYear.is_active && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => beginEdit(schoolYear)}
                                                title="Edit active school year"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <MiniStat label="Students" value={schoolYear.student_required_visits} />
                                        <MiniStat label="Employees" value={schoolYear.employee_required_visits} />
                                    </div>
                                    {!schoolYear.is_active && (
                                        <p className="mt-3 rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600">
                                            Historical record only. Previous school years cannot be reactivated.
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="rounded-lg border border-dashed border-[#040DBF]/20 p-5 text-sm text-[#020659]/70">
                                No school years yet. Add one to start tracking Student registrations.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const inputClass =
    'mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10';

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
    return (
        <label className={`text-sm font-medium text-[#010440] ${className ?? ''}`}>
            {label}
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </label>
    );
}

function MiniStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="admin-school-year-mini-stat rounded-md border border-[#040DBF]/10 bg-[#f6f8ff] px-2 py-1.5">
            <p className="font-medium text-[#030A8C]">{label}</p>
            <p className="mt-0.5 font-semibold text-[#010440]">{value.toLocaleString()}</p>
        </div>
    );
}
