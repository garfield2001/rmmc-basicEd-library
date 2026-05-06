import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type LibraryMemberRow } from '@/types/members';
import { useForm } from '@inertiajs/react';
import { BriefcaseBusiness, GraduationCap, ImagePlus } from 'lucide-react';
import { type FormEventHandler, useEffect, useRef, useState } from 'react';

interface MemberFormModalProps {
    member: LibraryMemberRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type MemberFormData = {
    _method: string;
    rfid_uid: string;
    school_id: string;
    type: 'student' | 'employee';
    first_name: string;
    middle_name: string;
    last_name: string;
    photo_file: File | null;
    is_active: boolean;
    year_level: string;
    section: string;
    department: string;
};

const steps = [
    {
        title: 'Identity',
        description: 'RFID card, school ID, and member type.',
    },
    {
        title: 'Profile',
        description: 'Name and basic member information.',
    },
    {
        title: 'Details',
        description: 'Student or employee details and account status.',
    },
];

function initialMemberData(member: LibraryMemberRow | null): MemberFormData {
    return {
        _method: member ? 'put' : 'post',
        rfid_uid: member?.rfid_uid ?? '',
        school_id: member?.school_id ?? '',
        type: member?.type ?? 'student',
        first_name: member?.first_name ?? '',
        middle_name: member?.middle_name ?? '',
        last_name: member?.last_name ?? '',
        photo_file: null,
        is_active: member?.is_active ?? true,
        year_level: member?.student?.year_level ?? '',
        section: member?.student?.section ?? '',
        department: member?.employee?.department ?? '',
    };
}

function fieldError(error?: string) {
    return error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null;
}

function isStepComplete(step: number, data: MemberFormData): boolean {
    if (step === 0) {
        return data.rfid_uid.trim().length > 0 && data.school_id.trim().length > 0;
    }

    if (step === 1) {
        return data.first_name.trim().length > 0 && data.last_name.trim().length > 0;
    }

    if (data.type === 'student') {
        return data.year_level.trim().length > 0 && data.section.trim().length > 0;
    }

    return data.department.trim().length > 0;
}

export function MemberFormModal({ member, open, onOpenChange }: MemberFormModalProps) {
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

        if (!isEditing && step < steps.length - 1) {
            if (!currentStepComplete) {
                return;
            }

            setStep((current) => current + 1);
            return;
        }

        if (!isEditing && !steps.every((_, index) => isStepComplete(index, data))) {
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
                                Step {step + 1} of {steps.length}
                            </span>
                            <span>{steps[step].title}</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#040DBF]/10">
                            <div
                                className="h-full rounded-full bg-[#040DBF] transition-[width] duration-300"
                                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                            />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#020659]">{steps[step].description}</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    {(isEditing || step === 0) && (
                        <section className={sectionClass}>
                            {isEditing && <h3 className="mb-4 text-sm font-semibold text-[#010440]">Identity</h3>}
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="text-sm font-medium text-[#010440]">
                                    RFID UID
                                    <input
                                        data-rfid-input="true"
                                        value={data.rfid_uid}
                                        onChange={(event) => setData('rfid_uid', event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                            }
                                        }}
                                        placeholder="Scan or enter RFID"
                                        className={inputClass}
                                        autoComplete="off"
                                        autoFocus={!isEditing}
                                    />
                                    {fieldError(errors.rfid_uid)}
                                </label>
                                <label className="text-sm font-medium text-[#010440]">
                                    School ID
                                    <input
                                        value={data.school_id}
                                        onChange={(event) => setData('school_id', event.target.value)}
                                        className={inputClass}
                                    />
                                    {fieldError(errors.school_id)}
                                </label>
                            </div>

                            <div className="mt-4 text-sm font-medium text-[#010440]">
                                Member type
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => changeMemberType('student')}
                                        className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition ${
                                            data.type === 'student'
                                                ? 'border-[#040DBF] bg-[#040DBF] text-white'
                                                : 'border-[#040DBF]/15 bg-white text-[#020659] hover:bg-[#f6f8ff]'
                                        }`}
                                    >
                                        <GraduationCap className="size-4" />
                                        Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => changeMemberType('employee')}
                                        className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition ${
                                            data.type === 'employee'
                                                ? 'border-[#040DBF] bg-[#040DBF] text-white'
                                                : 'border-[#040DBF]/15 bg-white text-[#020659] hover:bg-[#f6f8ff]'
                                        }`}
                                    >
                                        <BriefcaseBusiness className="size-4" />
                                        Employee
                                    </button>
                                </div>
                                {fieldError(errors.type)}
                            </div>
                        </section>
                    )}

                    {(isEditing || step === 1) && (
                        <section className={sectionClass}>
                            {isEditing && <h3 className="mb-4 text-sm font-semibold text-[#010440]">Profile</h3>}
                            <div className="grid gap-4 md:grid-cols-3">
                                <label className="text-sm font-medium text-[#010440]">
                                    First name
                                    <input
                                        value={data.first_name}
                                        onChange={(event) => setData('first_name', event.target.value)}
                                        className={inputClass}
                                    />
                                    {fieldError(errors.first_name)}
                                </label>
                                <label className="text-sm font-medium text-[#010440]">
                                    Middle name
                                    <input
                                        value={data.middle_name}
                                        onChange={(event) => setData('middle_name', event.target.value)}
                                        className={inputClass}
                                    />
                                    {fieldError(errors.middle_name)}
                                </label>
                                <label className="text-sm font-medium text-[#010440]">
                                    Last name
                                    <input
                                        value={data.last_name}
                                        onChange={(event) => setData('last_name', event.target.value)}
                                        className={inputClass}
                                    />
                                    {fieldError(errors.last_name)}
                                </label>
                            </div>
                        </section>
                    )}

                    {(isEditing || step === 2) && (
                        <section className={sectionClass}>
                            {isEditing && <h3 className="mb-4 text-sm font-semibold text-[#010440]">Details</h3>}
                            <div className="grid gap-4 md:grid-cols-2">
                                {data.type === 'student' ? (
                                    <>
                                        <label className="text-sm font-medium text-[#010440]">
                                            Year level
                                            <input
                                                value={data.year_level}
                                                onChange={(event) => setData('year_level', event.target.value)}
                                                className={inputClass}
                                            />
                                            {fieldError(errors.year_level)}
                                        </label>
                                        <label className="text-sm font-medium text-[#010440]">
                                            Section
                                            <input
                                                value={data.section}
                                                onChange={(event) => setData('section', event.target.value)}
                                                className={inputClass}
                                            />
                                            {fieldError(errors.section)}
                                        </label>
                                    </>
                                ) : (
                                    <label className="text-sm font-medium text-[#010440]">
                                        Department
                                        <input
                                            value={data.department}
                                            onChange={(event) => setData('department', event.target.value)}
                                            className={inputClass}
                                        />
                                        {fieldError(errors.department)}
                                    </label>
                                )}

                                <label className="text-sm font-medium text-[#010440]">
                                    Photo upload
                                    <span className="mt-2 flex h-10 items-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#020659]">
                                        <ImagePlus className="size-4" />
                                        <span className="truncate">
                                            {data.photo_file?.name ?? (member?.photo_url ? 'Keep current photo' : 'Choose photo')}
                                        </span>
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(event) => setData('photo_file', event.target.files?.[0] ?? null)}
                                        className="sr-only"
                                    />
                                    {fieldError(errors.photo_file)}
                                </label>
                            </div>

                            <label className="mt-4 flex items-center gap-2 text-sm font-medium text-[#010440]">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(event) => setData('is_active', event.target.checked)}
                                    className="size-4 rounded border-[#040DBF]/20"
                                />
                                Active member
                            </label>
                            {fieldError(errors.is_active)}
                        </section>
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
                                : step === steps.length - 1
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
