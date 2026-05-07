import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type LibraryMemberRow } from '@/types/members';
import { useForm } from '@inertiajs/react';
import { useEffect, useRef, useState, type FormEventHandler } from 'react';
import { DetailsSection, IdentitySection, ProfileSection } from './member-form-sections';
import { initialMemberData, isStepComplete, memberFormSteps, type MemberFormData } from './member-form-state';

interface MemberFormModalProps {
    member: LibraryMemberRow | null;
    open: boolean;
    sectionsByYearLevel: Record<string, string[]>;
    onOpenChange: (open: boolean) => void;
}

export function MemberFormModal({ member, open, sectionsByYearLevel, onOpenChange }: MemberFormModalProps) {
    const isEditing = Boolean(member);
    const [step, setStep] = useState(0);
    const scanBuffer = useRef('');
    const scanTimer = useRef<number | null>(null);
    const { data, setData, post, processing, errors, clearErrors, reset } = useForm<MemberFormData>(initialMemberData(member));
    const inputClass =
        'mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none transition focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10';
    const sectionClass = isEditing ? 'rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4' : 'space-y-4';
    const currentStepComplete = isStepComplete(step, data);

    useEffect(() => {
        if (!open) {
            return;
        }

        setStep(0);
        clearErrors();
        reset();
        setData(initialMemberData(member));
    }, [clearErrors, member, open, reset, setData]);

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

    const changeMemberType = (type: MemberFormData['type']) => {
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
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (!isEditing && step < memberFormSteps.length - 1) {
            if (!currentStepComplete) {
                return;
            }

            setStep((current) => current + 1);
            return;
        }

        if (!isEditing && !memberFormSteps.every((_, index) => isStepComplete(index, data))) {
            return;
        }

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (member) {
            post(`/admin/members/${member.id}`, options);
            return;
        }

        post('/admin/members', options);
    };

    const close = (nextOpen: boolean) => {
        if (!nextOpen && processing) {
            return;
        }

        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className={`max-h-[calc(100vh-2rem)] overflow-y-auto ${isEditing ? 'sm:max-w-4xl' : 'sm:max-w-3xl'}`}>
                <DialogHeader>
                    <DialogTitle className="text-2xl text-[#010440]">{isEditing ? 'Edit member' : 'Add member'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Update all library member details in one form.' : 'Create a member profile one clear step at a time.'}
                    </DialogDescription>
                </DialogHeader>

                {!isEditing && (
                    <div className="border-y border-[#040DBF]/10 py-4">
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.16em] text-[#030A8C] uppercase">
                            <span>
                                Step {step + 1} of {memberFormSteps.length}
                            </span>
                            <span>{memberFormSteps[step].title}</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#040DBF]/10">
                            <div
                                className="h-full rounded-full bg-[#040DBF] transition-[width] duration-300"
                                style={{ width: `${((step + 1) / memberFormSteps.length) * 100}%` }}
                            />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#020659]">{memberFormSteps[step].description}</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    {(isEditing || step === 0) && (
                        <IdentitySection
                            data={data}
                            errors={errors}
                            setData={setData}
                            inputClass={inputClass}
                            sectionClass={sectionClass}
                            isEditing={isEditing}
                            onTypeChange={changeMemberType}
                        />
                    )}

                    {(isEditing || step === 1) && (
                        <ProfileSection data={data} errors={errors} setData={setData} inputClass={inputClass} sectionClass={sectionClass} />
                    )}

                    {(isEditing || step === 2) && (
                        <DetailsSection
                            data={data}
                            errors={errors}
                            setData={setData}
                            inputClass={inputClass}
                            sectionClass={sectionClass}
                            member={member}
                            sectionOptions={data.year_level ? (sectionsByYearLevel[data.year_level] ?? []) : []}
                        />
                    )}

                    {!isEditing && !currentStepComplete && (
                        <p className="text-sm font-medium text-[#030A8C]">Complete the required fields in this step to continue.</p>
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
                                : step === memberFormSteps.length - 1
                                  ? processing
                                      ? 'Saving...'
                                      : 'Create member'
                                  : 'Continue'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
