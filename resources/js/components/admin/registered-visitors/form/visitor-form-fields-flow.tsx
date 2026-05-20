import { type LibraryMemberRow } from '@/types/registered-visitors';
import { DetailsSection, IdentitySection, ProfileSection } from './visitor-form-sections';
import type { VisitorFormData } from './visitor-form-state';

interface VisitorFormFieldsFlowProps {
    data: VisitorFormData;
    errors: Partial<Record<keyof VisitorFormData | 'confirm_merge_duplicates', string>>;
    step: number;
    isEditing: boolean;
    visitor: LibraryMemberRow | null;
    sectionsByYearLevel: Record<string, string[]>;
    inputClass: string;
    sectionClass: string;
    setData: (field: keyof VisitorFormData, value: VisitorFormData[keyof VisitorFormData]) => void;
    onTypeChange: (type: VisitorFormData['type']) => void;
}

export function VisitorFormFieldsFlow({
    data,
    errors,
    step,
    isEditing,
    visitor,
    sectionsByYearLevel,
    inputClass,
    sectionClass,
    setData,
    onTypeChange,
}: VisitorFormFieldsFlowProps) {
    return (
        <>
            {(isEditing || step === 0) && (
                <IdentitySection
                    data={data}
                    errors={errors}
                    setData={setData}
                    inputClass={inputClass}
                    sectionClass={sectionClass}
                    isEditing={isEditing}
                    onTypeChange={onTypeChange}
                />
            )}

            {(isEditing || step === 1) && <ProfileSection data={data} errors={errors} setData={setData} inputClass={inputClass} sectionClass={sectionClass} />}

            {(isEditing || step === 2) && (
                <DetailsSection
                    data={data}
                    errors={errors}
                    setData={setData}
                    inputClass={inputClass}
                    sectionClass={sectionClass}
                    visitor={visitor}
                    sectionOptions={data.year_level ? (sectionsByYearLevel[data.year_level] ?? []) : []}
                />
            )}
        </>
    );
}
