import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SchoolYearRow } from '@/types/school-year';
import { router, useForm } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEventHandler } from 'react';
import { SchoolYearFormPanel } from './form-panel';
import { SchoolYearHistoryList } from './history-list';
import { emptySchoolYearForm, type SchoolYearForm } from './types';

export function SchoolYearDetailsDialog({
    open,
    schoolYears,
    onOpenChange,
    requireActiveSchoolYear,
}: {
    open: boolean;
    schoolYears: SchoolYearRow[];
    onOpenChange: (open: boolean) => void;
    requireActiveSchoolYear: boolean;
}) {
    const activeSchoolYear = useMemo(() => schoolYears.find((schoolYear) => schoolYear.is_active) ?? null, [schoolYears]);
    const previousSchoolYear = activeSchoolYear ?? schoolYears[0] ?? null;
    const [editingSchoolYearId, setEditingSchoolYearId] = useState<number | null>(null);
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm<SchoolYearForm>({ ...emptySchoolYearForm });
    const editingSchoolYear = schoolYears.find((schoolYear) => schoolYear.id === editingSchoolYearId) ?? null;
    const transitionYearStart = new Date().getFullYear();

    useEffect(() => {
        if (!open) {
            setEditingSchoolYearId(null);
            return;
        }

        if (!editingSchoolYearId) {
            setData({ ...emptySchoolYearForm, transfer_employees: false });
            clearErrors();
        }
    }, [clearErrors, editingSchoolYearId, open, setData]);

    const beginCreate = () => {
        setEditingSchoolYearId(null);
        reset();
        setData({ ...emptySchoolYearForm, transfer_employees: false });
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
            onSuccess: () => onOpenChange(false),
        };

        if (editingSchoolYearId) {
            patch(`/admin/school-years/${editingSchoolYearId}`, options);
            return;
        }

        post('/admin/school-years', options);
    };

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => (requireActiveSchoolYear && !nextOpen ? undefined : onOpenChange(nextOpen))}>
            <DialogContent
                hideClose={requireActiveSchoolYear}
                className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl"
                onOpenAutoFocus={(event) => event.preventDefault()}
                onEscapeKeyDown={(event) => {
                    if (requireActiveSchoolYear) {
                        event.preventDefault();
                    }
                }}
                onPointerDownOutside={(event) => {
                    if (requireActiveSchoolYear) {
                        event.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle className="text-2xl text-[#010440]">
                            School year details
                        </DialogTitle>
                        {requireActiveSchoolYear && (
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3 py-1.5 text-xs font-semibold text-[#020659] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                title="Log out"
                            >
                                <LogOut className="size-3.5" />
                                <span>Log out</span>
                            </button>
                        )}
                    </div>
                    <DialogDescription>
                        {requireActiveSchoolYear
                            ? 'An active school year is required before using the library system. Please create or transition to a school year.'
                            : 'Transition to the next school year, review historical years, and edit visit targets.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
                    <SchoolYearFormPanel
                        data={data}
                        errors={errors}
                        processing={processing}
                        editingSchoolYear={editingSchoolYear}
                        hasPreviousSchoolYear={Boolean(previousSchoolYear)}
                        previousSchoolYear={previousSchoolYear}
                        transitionYearStart={transitionYearStart}
                        transitionYearEnd={transitionYearStart + 5}
                        onSubmit={submit}
                        onBeginCreate={beginCreate}
                        onFieldChange={setData}
                    />
                    <SchoolYearHistoryList schoolYears={schoolYears} onEdit={beginEdit} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
