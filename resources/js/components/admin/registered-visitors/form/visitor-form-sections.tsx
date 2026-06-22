import { SelectInput } from '@/components/ui/select-input';
import { studentYearLevels } from '@/constants/academic';
import type { LibraryMemberRow } from '@/types/registered-visitors';
import { BriefcaseBusiness, GraduationCap, ImagePlus } from 'lucide-react';
import { fieldError, VisitorTypeButton } from './visitor-form-section-ui';
import type { VisitorFormData } from './visitor-form-state';

interface SectionProps {
    data: VisitorFormData;
    errors: Partial<Record<keyof VisitorFormData, string>>;
    setData: (field: keyof VisitorFormData, value: VisitorFormData[keyof VisitorFormData]) => void;
    inputClass: string;
    sectionClass: string;
}

interface IdentitySectionProps extends SectionProps {
    isEditing: boolean;
    onTypeChange: (type: VisitorFormData['type']) => void;
}

interface DetailsSectionProps extends SectionProps {
    visitor: LibraryMemberRow | null;
    sectionOptions: string[];
}

export function IdentitySection({ data, errors, setData, inputClass, sectionClass, isEditing, onTypeChange }: IdentitySectionProps) {
    return (
        <section className={sectionClass}>
            {isEditing && <h3 className="mb-4 text-sm font-semibold text-[#010440]">Identity</h3>}
            <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-[#010440]">
                    RFID Unique ID
                    <input
                        data-rfid-input="true"
                        value={data.rfid_uid}
                        onChange={(event) => setData('rfid_uid', event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
                        placeholder="Scan or enter RFID"
                        className={inputClass}
                        autoComplete="off"
                        autoFocus={!isEditing}
                    />
                    {fieldError(errors.rfid_uid)}
                </label>
                <label className="text-sm font-medium text-[#010440]">
                    School ID
                    <input value={data.school_id} onChange={(event) => setData('school_id', event.target.value)} className={inputClass} />
                    {fieldError(errors.school_id)}
                </label>
            </div>

            {!isEditing && (
                <div className="mt-4 text-sm font-medium text-[#010440]">
                    Visitor type
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <VisitorTypeButton
                            active={data.type === 'student'}
                            icon={GraduationCap}
                            label="Student"
                            onClick={() => onTypeChange('student')}
                        />
                        <VisitorTypeButton
                            active={data.type === 'employee'}
                            icon={BriefcaseBusiness}
                            label="employee"
                            onClick={() => onTypeChange('employee')}
                        />
                    </div>
                    {fieldError(errors.type)}
                </div>
            )}
        </section>
    );
}

export function ProfileSection({ data, errors, setData, inputClass, sectionClass }: SectionProps) {
    return (
        <section className={sectionClass}>
            <h3 className="mb-4 text-sm font-semibold text-[#010440]">Profile</h3>
            <div className="grid gap-4 md:grid-cols-3">
                {(['first_name', 'middle_name', 'last_name'] as const).map((field) => (
                    <label key={field} className="text-sm font-medium text-[#010440]">
                        {field === 'first_name' ? 'First name' : field === 'middle_name' ? 'Middle name' : 'Last name'}
                        <input value={data[field]} onChange={(event) => setData(field, event.target.value)} className={inputClass} />
                        {fieldError(errors[field])}
                    </label>
                ))}
            </div>
        </section>
    );
}

export function DetailsSection({ data, errors, setData, inputClass, sectionClass, visitor, sectionOptions }: DetailsSectionProps) {
    return (
        <section className={sectionClass}>
            <h3 className="mb-4 text-sm font-semibold text-[#010440]">Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
                {data.type === 'student' ? (
                    <>
                        <label className="text-sm font-medium text-[#010440]">
                            Year level
                            <SelectInput
                                value={data.year_level}
                                onChange={(event) => setData('year_level', event.target.value)}
                                className={inputClass}
                            >
                                <option value="">Choose year level</option>
                                {studentYearLevels.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </SelectInput>
                            {fieldError(errors.year_level)}
                        </label>
                        <label className="text-sm font-medium text-[#010440]">
                            Section
                            <input
                                list="visitor-section-options"
                                value={data.section}
                                onChange={(event) => setData('section', event.target.value)}
                                className={inputClass}
                                placeholder="Section optional"
                            />
                            <datalist id="visitor-section-options">
                                {sectionOptions.map((section) => (
                                    <option key={section} value={section} />
                                ))}
                            </datalist>
                            {fieldError(errors.section)}
                        </label>
                    </>
                ) : (
                    <label className="text-sm font-medium text-[#010440]">
                        Department
                        <input value={data.department} onChange={(event) => setData('department', event.target.value)} className={inputClass} />
                        {fieldError(errors.department)}
                    </label>
                )}

                <label className="text-sm font-medium text-[#010440]">
                    Photo upload
                    <span className="mt-2 flex h-10 items-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#020659]">
                        <ImagePlus className="size-4" />
                        <span className="truncate">{data.photo_file?.name ?? (visitor?.photo_url ? 'Keep current photo' : 'Choose photo')}</span>
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
        </section>
    );
}
