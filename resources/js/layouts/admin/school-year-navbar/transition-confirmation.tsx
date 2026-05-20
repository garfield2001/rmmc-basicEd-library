import type { SchoolYearRow } from '@/types/school-year';
import { AlertTriangle } from 'lucide-react';
import type { SchoolYearForm } from './types';

interface SchoolYearTransitionConfirmationProps {
    data: SchoolYearForm;
    editingSchoolYear: SchoolYearRow | null;
    hasPreviousSchoolYear: boolean;
    onFieldChange: <K extends keyof SchoolYearForm>(field: K, value: SchoolYearForm[K]) => void;
}

export function SchoolYearTransitionConfirmation({
    data,
    editingSchoolYear,
    hasPreviousSchoolYear,
    onFieldChange,
}: SchoolYearTransitionConfirmationProps) {
    if (editingSchoolYear) {
        return null;
    }

    if (!hasPreviousSchoolYear) {
        return (
            <div className="mt-4 rounded-lg border border-[#040DBF]/10 bg-white p-3 text-sm text-[#020659]/75">
                <label className="flex items-center gap-2 font-medium text-[#010440]">
                    <input
                        type="checkbox"
                        checked={Boolean(data.confirmed_transition)}
                        onChange={(event) => onFieldChange('confirmed_transition', event.target.checked)}
                        className="size-4 rounded border-[#040DBF]/20"
                    />
                    I understand this is a one-way school-year transition.
                </label>
            </div>
        );
    }

    return (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>
                    Creating this school year makes it active and starts with no students or employees unless you transfer employee profiles below.
                    Previous visits remain available in Reports.
                </p>
            </div>
            <label className="mt-3 flex items-center gap-2 font-medium">
                <input
                    type="checkbox"
                    checked={Boolean(data.transfer_employees)}
                    onChange={(event) => onFieldChange('transfer_employees', event.target.checked)}
                    className="size-4 rounded border-amber-300"
                />
                Transfer employee profiles from the previous school year.
            </label>
            <label className="mt-3 flex items-center gap-2 font-medium">
                <input
                    type="checkbox"
                    checked={Boolean(data.confirmed_transition)}
                    onChange={(event) => onFieldChange('confirmed_transition', event.target.checked)}
                    className="size-4 rounded border-amber-300"
                />
                I understand this is a one-way school-year transition.
            </label>
        </div>
    );
}
