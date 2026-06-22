import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import type { SchoolYearRow } from '@/types/school-year';
import { Plus, Save } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { SchoolYearField, schoolYearInputClass } from './form-field';
import { SchoolYearTransitionConfirmation } from './transition-confirmation';
import type { SchoolYearForm, SchoolYearFormErrors } from './types';

interface SchoolYearFormPanelProps {
    data: SchoolYearForm;
    errors: SchoolYearFormErrors;
    processing: boolean;
    editingSchoolYear: SchoolYearRow | null;
    hasPreviousSchoolYear: boolean;
    previousSchoolYear: SchoolYearRow | null;
    transitionYearStart: number;
    transitionYearEnd: number;
    onSubmit: FormEventHandler;
    onBeginCreate: () => void;
    onFieldChange: <K extends keyof SchoolYearForm>(field: K, value: SchoolYearForm[K]) => void;
}

export function SchoolYearFormPanel({
    data,
    errors,
    processing,
    editingSchoolYear,
    hasPreviousSchoolYear,
    previousSchoolYear,
    transitionYearStart,
    transitionYearEnd,
    onSubmit,
    onBeginCreate,
    onFieldChange,
}: SchoolYearFormPanelProps) {
    return (
        <form onSubmit={onSubmit} className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-[#010440]">
                        {editingSchoolYear ? 'Edit school year' : hasPreviousSchoolYear ? 'Transition to new school year' : 'Create a school year'}
                    </h3>
                    <p className="text-sm text-[#020659]/70">
                        {editingSchoolYear
                            ? editingSchoolYear.name
                            : hasPreviousSchoolYear
                              ? 'The name is generated from the start and end year, and this action cannot be reverted.'
                              : 'The name is generated from the start and end year.'}
                    </p>
                </div>
                {editingSchoolYear && (
                    <Button type="button" variant="outline" size="sm" onClick={onBeginCreate}>
                        <Plus className="size-4" />
                        New
                    </Button>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <SchoolYearField label="Start" error={errors.starts_at}>
                    <DateInput
                        value={data.starts_at}
                        onChange={(value) => onFieldChange('starts_at', value)}
                        className="mt-2"
                        openOnFocus={false}
                        placeholder="mm/dd/yyyy"
                        min={editingSchoolYear ? undefined : previousSchoolYear?.ends_at}
                        yearWindowStart={editingSchoolYear ? undefined : transitionYearStart}
                        yearWindowEnd={editingSchoolYear ? undefined : transitionYearEnd}
                    />
                </SchoolYearField>
                <SchoolYearField label="End" error={errors.ends_at}>
                    <DateInput
                        value={data.ends_at}
                        onChange={(value) => onFieldChange('ends_at', value)}
                        className="mt-2"
                        openOnFocus={false}
                        placeholder="mm/dd/yyyy"
                        min={editingSchoolYear ? data.starts_at || undefined : data.starts_at || previousSchoolYear?.ends_at}
                        yearWindowStart={editingSchoolYear ? undefined : transitionYearStart}
                        yearWindowEnd={editingSchoolYear ? undefined : transitionYearEnd}
                    />
                </SchoolYearField>
                <p className="-mt-2 text-xs leading-5 text-[#020659]/70 sm:col-span-2">
                    You can type dates like March 6 2027, March 6, 2027, or 03/06/2027. Numeric dates add slashes while typing.
                </p>
                <SchoolYearField label="Required student visits" error={errors.student_required_visits}>
                    <input
                        type="number"
                        min="0"
                        value={data.student_required_visits}
                        onChange={(event) => onFieldChange('student_required_visits', event.target.value === '' ? '' : Number(event.target.value))}
                        className={schoolYearInputClass}
                    />
                </SchoolYearField>
                <SchoolYearField label="Required employee visits" error={errors.employee_required_visits}>
                    <input
                        type="number"
                        min="0"
                        value={data.employee_required_visits}
                        onChange={(event) => onFieldChange('employee_required_visits', event.target.value === '' ? '' : Number(event.target.value))}
                        className={schoolYearInputClass}
                    />
                </SchoolYearField>
            </div>

            <SchoolYearTransitionConfirmation
                data={data}
                editingSchoolYear={editingSchoolYear}
                hasPreviousSchoolYear={hasPreviousSchoolYear}
                onFieldChange={onFieldChange}
            />

            <div className="mt-5 flex justify-end">
                <Button type="submit" disabled={processing || (!editingSchoolYear && !data.confirmed_transition)}>
                    {editingSchoolYear ? <Save className="size-4" /> : <Plus className="size-4" />}
                    {processing ? 'Saving...' : editingSchoolYear ? 'Save changes' : 'Transition school year'}
                </Button>
            </div>
        </form>
    );
}
