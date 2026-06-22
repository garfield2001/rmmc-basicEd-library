import type { VisitorFormData } from './visitor-form-state';

export function VisitorFormStepAlert({ show, hasErrors }: { show: boolean; hasErrors: boolean }) {
    if (!show) {
        return null;
    }

    return (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            {hasErrors
                ? 'Resolve the highlighted errors in this step before continuing.'
                : 'Complete the required fields in this step before continuing.'}
        </p>
    );
}

export function VisitorMergeWarning({ errors }: { errors: Partial<Record<keyof VisitorFormData | 'confirm_merge_duplicates', string>> }) {
    if (!errors.confirm_merge_duplicates) {
        return null;
    }

    return (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            {errors.confirm_merge_duplicates}
        </p>
    );
}
