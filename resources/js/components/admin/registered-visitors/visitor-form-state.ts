import type { RegisteredVisitorRow } from '@/types/registered-visitors';

export type VisitorFormData = {
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

export const visitorFormSteps = [
    {
        title: 'Identity',
        description: 'RFID card, school ID, and visitor type.',
    },
    {
        title: 'Profile',
        description: 'Name and basic visitor information.',
    },
    {
        title: 'Details',
        description: 'Student or employee details and account status.',
    },
];

export function initialVisitorData(visitor: RegisteredVisitorRow | null): VisitorFormData {
    return {
        _method: visitor ? 'put' : 'post',
        rfid_uid: visitor?.rfid_uid ?? '',
        school_id: visitor?.school_id ?? '',
        type: visitor?.type ?? 'student',
        first_name: visitor?.first_name ?? '',
        middle_name: visitor?.middle_name ?? '',
        last_name: visitor?.last_name ?? '',
        photo_file: null,
        is_active: visitor?.is_active ?? true,
        year_level: visitor?.student?.year_level ?? '',
        section: visitor?.student?.section ?? '',
        department: visitor?.employee?.department ?? '',
    };
}

export function isStepComplete(step: number, data: VisitorFormData): boolean {
    if (step === 0) {
        return data.rfid_uid.trim().length > 0 && data.school_id.trim().length > 0;
    }

    if (step === 1) {
        return data.first_name.trim().length > 0 && data.last_name.trim().length > 0;
    }

    if (data.type === 'student') {
        return data.year_level.trim().length > 0;
    }

    return data.department.trim().length > 0;
}

export function firstStepWithErrors(errors: Partial<Record<keyof VisitorFormData, string>>): number | null {
    if (errors.rfid_uid || errors.school_id || errors.type) {
        return 0;
    }

    if (errors.first_name || errors.middle_name || errors.last_name || errors.photo_file) {
        return 1;
    }

    if (errors.year_level || errors.section || errors.department || errors.is_active) {
        return 2;
    }

    return null;
}

export function stepHasErrors(step: number, errors: Partial<Record<keyof VisitorFormData, string>>): boolean {
    return firstStepWithErrors(errors) === step;
}
