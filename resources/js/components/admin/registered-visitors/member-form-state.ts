import type { RegisteredVisitorRow } from '@/types/registered-visitors';

export type MemberFormData = {
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

export const memberFormSteps = [
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

export function initialMemberData(member: RegisteredVisitorRow | null): MemberFormData {
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

export function isStepComplete(step: number, data: MemberFormData): boolean {
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

export function firstStepWithErrors(errors: Partial<Record<keyof MemberFormData, string>>): number | null {
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

export function stepHasErrors(step: number, errors: Partial<Record<keyof MemberFormData, string>>): boolean {
    return firstStepWithErrors(errors) === step;
}
