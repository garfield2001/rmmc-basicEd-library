import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type RegisteredVisitorRow } from '@/types/registered-visitors';
import { useForm } from '@inertiajs/react';
import { useEffect, useRef, useState, type FormEventHandler } from 'react';
import { DetailsSection, IdentitySection, ProfileSection } from './visitor-form-sections';
import { firstStepWithErrors, initialVisitorData, isStepComplete, stepHasErrors, visitorFormSteps, type VisitorFormData } from './visitor-form-state';

interface VisitorFormModalProps {
    visitor: RegisteredVisitorRow | null;
    open: boolean;
    sectionsByYearLevel: Record<string, string[]>;
    onOpenChange: (open: boolean) => void;
}

export function VisitorFormModal({ visitor, open, sectionsByYearLevel, onOpenChange }: VisitorFormModalProps) {
    const isEditing = Boolean(visitor);
    const [step, setStep] = useState(0);
    const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
    const [confirmMergeOpen, setConfirmMergeOpen] = useState(false);
    const scanBuffer = useRef('');
    const scanTimer = useRef<number | null>(null);
    const { data, setData, post, processing, errors, clearErrors, reset, transform } = useForm<VisitorFormData>(initialVisitorData(visitor));
    const inputClass =
        'mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none transition focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10';
    const sectionClass = isEditing ? 'rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4' : 'space-y-4';
    const currentStepComplete = isStepComplete(step, data);
    const currentStepHasErrors = stepHasErrors(step, errors);
    const editTitle = visitor?.type === 'employee' ? 'Edit employee details' : 'Edit student details';

    useEffect(() => {
        if (!open) {
            return;
        }

        setStep(0);
        setAttemptedStep(null);
        setConfirmMergeOpen(false);
        clearErrors();
        reset();
        setData(initialVisitorData(visitor));
    }, [clearErrors, visitor, open, reset, setData]);

    useEffect(() => {
        if (!open || isEditing) {
            return;
        }

        const listener = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTypingField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';

            if (isTypingField) {
                return;
            }

            if (event.key === 'Enter') {
                if (scanBuffer.current) {
                    setData('rfid_uid', scanBuffer.current);
                    setStep(0);
                    scanBuffer.current = '';
                }
                return;
            }

            if (event.key.length === 1) {
                scanBuffer.current += event.key;

                if (scanTimer.current) {
                    window.clearTimeout(scanTimer.current);
                }

                scanTimer.current = window.setTimeout(() => {
                    if (scanBuffer.current.length >= 10) {
                        setData('rfid_uid', scanBuffer.current);
                        setStep(0);
                    }

                    scanBuffer.current = '';
                }, 80);
            }
        };

        window.addEventListener('keydown', listener);

        return () => {
            window.removeEventListener('keydown', listener);

            if (scanTimer.current) {
                window.clearTimeout(scanTimer.current);
            }
        };
    }, [isEditing, open, setData]);

    const changeVisitorType = (type: VisitorFormData['type']) => {
        setData({
            ...data,
            type,
            ...(type === 'student'
                ? {
                      department: '',
                  }
                : {
                      year_level: '',
                      section: '',
                  }),
        });
        clearErrors('type', 'department', 'year_level', 'section');
    };

    const updateData = (field: keyof VisitorFormData, value: VisitorFormData[keyof VisitorFormData]) => {
        setData(field, value);
        clearErrors(field);
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

        transform((formData) => ({
            ...formData,
            confirm_merge_duplicates: confirmMerge || formData.confirm_merge_duplicates,
        }));

        if (visitor) {
            post(`/admin/registered-visitors/${visitor.id}`, options);
            return;
        }

        post('/admin/registered-visitors', options);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (!isEditing && step < visitorFormSteps.length - 1) {
            setAttemptedStep(step);

            if (!currentStepComplete) {
                return;
            }

            if (currentStepHasErrors) {
                return;
            }

            setAttemptedStep(null);
            setStep((current) => current + 1);
            return;
        }

        if (!isEditing && !visitorFormSteps.every((_, index) => isStepComplete(index, data))) {
            setAttemptedStep(step);
            return;
        }

        submitVisitor();
    };

    const close = (nextOpen: boolean) => {
        if (!nextOpen && processing) {
            return;
        }

        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent
                onOpenAutoFocus={(event) => {
                    if (isEditing) {
                        event.preventDefault();
                    }
                }}
                className={`max-h-[calc(100dvh-2rem)] overflow-y-auto pb-8 ${isEditing ? 'top-4 ![translate:-50%_0] sm:max-w-4xl' : 'sm:max-w-3xl'}`}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl text-[#010440]">{isEditing ? editTitle : 'Add visitor'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Review or update this visitor's library profile and active details."
                            : 'Create a registered visitor profile one clear step at a time.'}
                    </DialogDescription>
                </DialogHeader>

                {!isEditing && (
                    <div className="border-y border-[#040DBF]/10 py-4">
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.16em] text-[#030A8C] uppercase">
                            <span>
                                Step {step + 1} of {visitorFormSteps.length}
                            </span>
                            <span>{visitorFormSteps[step].title}</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#040DBF]/10">
                            <div
                                className="h-full rounded-full bg-[#040DBF] transition-[width] duration-300"
                                style={{ width: `${((step + 1) / visitorFormSteps.length) * 100}%` }}
                            />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#020659]">{visitorFormSteps[step].description}</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    {(isEditing || step === 0) && (
                        <IdentitySection
                            data={data}
                            errors={errors}
                            setData={updateData}
                            inputClass={inputClass}
                            sectionClass={sectionClass}
                            isEditing={isEditing}
                            onTypeChange={changeVisitorType}
                        />
                    )}

                    {(isEditing || step === 1) && (
                        <ProfileSection data={data} errors={errors} setData={updateData} inputClass={inputClass} sectionClass={sectionClass} />
                    )}

                    {(isEditing || step === 2) && (
                        <DetailsSection
                            data={data}
                            errors={errors}
                            setData={updateData}
                            inputClass={inputClass}
                            sectionClass={sectionClass}
                            visitor={visitor}
                            sectionOptions={data.year_level ? (sectionsByYearLevel[data.year_level] ?? []) : []}
                        />
                    )}

                    {!isEditing && attemptedStep === step && (!currentStepComplete || currentStepHasErrors) && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                            {currentStepHasErrors
                                ? 'Resolve the highlighted errors in this step before continuing.'
                                : 'Complete the required fields in this step before continuing.'}
                        </p>
                    )}

                    {isEditing && errors.confirm_merge_duplicates && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                            {errors.confirm_merge_duplicates}
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => close(false)} disabled={processing}>
                            Cancel
                        </Button>
                        {!isEditing && step > 0 && (
                            <Button type="button" variant="secondary" onClick={() => setStep((current) => current - 1)} disabled={processing}>
                                Back
                            </Button>
                        )}
                        <Button type="submit" disabled={processing}>
                            {isEditing
                                ? processing
                                    ? 'Saving...'
                                    : 'Save changes'
                                : step === visitorFormSteps.length - 1
                                  ? processing
                                      ? 'Saving...'
                                      : 'Create visitor'
                                  : 'Continue'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>

            <Dialog open={confirmMergeOpen} onOpenChange={(nextOpen) => !processing && setConfirmMergeOpen(nextOpen)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-[#010440]">Merge duplicate profiles?</DialogTitle>
                        <DialogDescription>
                            This visitor now has a usable RFID or school ID. Keep this record, move any visit history here, and delete unresolved
                            duplicate placeholder records behind the scenes.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setConfirmMergeOpen(false)} disabled={processing}>
                            Review first
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setData('confirm_merge_duplicates', true);
                                clearErrors('confirm_merge_duplicates');
                                submitVisitor(true);
                            }}
                            disabled={processing}
                        >
                            {processing ? 'Merging...' : 'Merge duplicates'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
