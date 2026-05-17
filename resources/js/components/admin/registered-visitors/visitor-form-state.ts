import type { RegisteredVisitorRow } from '@/types/registered-visitors';

export type VisitorFormData = {
    _method: string;
    rfid_uid: string;
    school_id: string;
    confirm_merge_duplicates: boolean;
    type: 'student' | 'employee';
    first_name: string;
    middle_name: string;
    last_name: string;
    photo_file: File | null;
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
        description: 'Student or employee details.',
    },
];

export function initialVisitorData(visitor: RegisteredVisitorRow | null): VisitorFormData {
    return {
        _method: visitor ? 'put' : 'post',
        rfid_uid: visitor?.rfid_uid ?? '',
        school_id: visitor?.school_id ?? '',
        confirm_merge_duplicates: false,
        type: visitor?.type ?? 'student',
        first_name: visitor?.first_name ?? '',
        middle_name: visitor?.middle_name ?? '',
        last_name: visitor?.last_name ?? '',
        photo_file: null,
        year_level: visitor?.student?.year_level ?? '',
        section: visitor?.student?.section ?? '',
        department: visitor?.employee?.department ?? '',
    };
}

export function isStepComplete(step: number, data: VisitorFormData): boolean {
    if (step === 0) {
        return data.type.trim().length > 0;
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
    if (errors.rfid_uid || errors.school_id || errors.type || errors.confirm_merge_duplicates) {
        return 0;
    }

    if (errors.first_name || errors.middle_name || errors.last_name || errors.photo_file) {
        return 1;
    }

    if (errors.year_level || errors.section || errors.department) {
        return 2;
    }

    return null;
}

export function stepHasErrors(step: number, errors: Partial<Record<keyof VisitorFormData, string>>): boolean {
    return firstStepWithErrors(errors) === step;
}
