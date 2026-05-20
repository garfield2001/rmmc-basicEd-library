import { type LibraryMemberRow } from '@/types/registered-visitors';
import { useForm } from '@inertiajs/react';
import { useCallback, useEffect, useState, type FormEventHandler } from 'react';
import { useRfidScanBuffer } from './use-rfid-scan-buffer';
import { firstStepWithErrors, initialVisitorData, isStepComplete, stepHasErrors, visitorFormSteps, type VisitorFormData } from './visitor-form-state';

interface UseVisitorFormModalOptions {
    visitor: LibraryMemberRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function useVisitorFormModal({ visitor, open, onOpenChange }: UseVisitorFormModalOptions) {
    const isEditing = Boolean(visitor);
    const [step, setStep] = useState(0);
    const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
    const [confirmMergeOpen, setConfirmMergeOpen] = useState(false);
    const form = useForm<VisitorFormData>(initialVisitorData(visitor));
    const currentStepComplete = isStepComplete(step, form.data);
    const currentStepHasErrors = stepHasErrors(step, form.errors);

    useEffect(() => {
        if (!open) {
            return;
        }

        setStep(0);
        setAttemptedStep(null);
        setConfirmMergeOpen(false);
        form.clearErrors();
        form.reset();
        form.setData(initialVisitorData(visitor));
    }, [form.clearErrors, visitor, open, form.reset, form.setData]);

    const acceptScan = useCallback(
        (rfidUid: string) => {
            form.setData('rfid_uid', rfidUid);
            setStep(0);
        },
        [form.setData],
    );

    useRfidScanBuffer({ enabled: open && !isEditing, onScan: acceptScan });

    const changeVisitorType = (type: VisitorFormData['type']) => {
        form.setData({
            ...form.data,
            type,
            ...(type === 'student' ? { department: '' } : { year_level: '', section: '' }),
        });
        form.clearErrors('type', 'department', 'year_level', 'section');
    };

    const updateData = (field: keyof VisitorFormData, value: VisitorFormData[keyof VisitorFormData]) => {
        form.setData(field, value);
        form.clearErrors(field);
    };

    const submitVisitor = (confirmMerge = false) => {
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setConfirmMergeOpen(false);
                onOpenChange(false);
            },
            onError: (formErrors: Partial<Record<keyof VisitorFormData | 'confirm_merge_duplicates', string>>) => {
                if (typeof formErrors.confirm_merge_duplicates === 'string') {
                    setConfirmMergeOpen(true);
                    return;
                }

                const errorStep = firstStepWithErrors(formErrors as Partial<Record<keyof VisitorFormData, string>>);

                if (errorStep !== null) {
                    setStep(errorStep);
                    setAttemptedStep(errorStep);
                }
            },
        };

        form.transform((formData) => ({
            ...formData,
            confirm_merge_duplicates: confirmMerge || formData.confirm_merge_duplicates,
        }));
        form.post(visitor ? `/admin/registered-visitors/${visitor.id}` : '/admin/registered-visitors', options);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (!isEditing && step < visitorFormSteps.length - 1) {
            setAttemptedStep(step);

            if (currentStepComplete && !currentStepHasErrors) {
                setAttemptedStep(null);
                setStep((current) => current + 1);
            }

            return;
        }

        if (!isEditing && !visitorFormSteps.every((_, index) => isStepComplete(index, form.data))) {
            setAttemptedStep(step);
            return;
        }

        submitVisitor();
    };

    const close = (nextOpen: boolean) => {
        if (!nextOpen && form.processing) {
            return;
        }

        onOpenChange(nextOpen);
    };

    const confirmMerge = () => {
        form.setData('confirm_merge_duplicates', true);
        form.clearErrors('confirm_merge_duplicates');
        submitVisitor(true);
    };

    return {
        ...form,
        attemptedStep,
        changeVisitorType,
        close,
        confirmMerge,
        confirmMergeOpen,
        currentStepComplete,
        currentStepHasErrors,
        isEditing,
        setConfirmMergeOpen,
        setStep,
        step,
        submit,
        updateData,
    };
}
