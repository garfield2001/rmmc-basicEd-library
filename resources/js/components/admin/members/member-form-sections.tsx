import { studentYearLevels } from '@/constants/academic';
import type { LibraryMemberRow } from '@/types/members';
import { BriefcaseBusiness, GraduationCap, ImagePlus } from 'lucide-react';
import type { MemberFormData } from './member-form-state';

interface SectionProps {
    data: MemberFormData;
    errors: Partial<Record<keyof MemberFormData, string>>;
    setData: (field: keyof MemberFormData, value: MemberFormData[keyof MemberFormData]) => void;
    inputClass: string;
    sectionClass: string;
}

interface IdentitySectionProps extends SectionProps {
    isEditing: boolean;
    onTypeChange: (type: MemberFormData['type']) => void;
}

interface DetailsSectionProps extends SectionProps {
    member: LibraryMemberRow | null;
    sectionOptions: string[];
}

export function IdentitySection({ data, errors, setData, inputClass, sectionClass, isEditing, onTypeChange }: IdentitySectionProps) {
    return (
        <section className={sectionClass}>
            {isEditing && <h3 className="mb-4 text-sm font-semibold text-[#010440]">Identity</h3>}
            <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-[#010440]">
                    RFID UID
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

            <div className="mt-4 text-sm font-medium text-[#010440]">
                Member type
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <TypeButton active={data.type === 'student'} icon={GraduationCap} label="Student" onClick={() => onTypeChange('student')} />
                    <TypeButton active={data.type === 'employee'} icon={BriefcaseBusiness} label="Employee" onClick={() => onTypeChange('employee')} />
                </div>
                {fieldError(errors.type)}
            </div>
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

export function DetailsSection({ data, errors, setData, inputClass, sectionClass, member, sectionOptions }: DetailsSectionProps) {
    return (
        <section className={sectionClass}>
            <h3 className="mb-4 text-sm font-semibold text-[#010440]">Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
                {data.type === 'student' ? (
                    <>
                        <label className="text-sm font-medium text-[#010440]">
                            Year level
                            <select value={data.year_level} onChange={(event) => setData('year_level', event.target.value)} className={inputClass}>
                                <option value="">Choose year level</option>
                                {studentYearLevels.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                            {fieldError(errors.year_level)}
                        </label>
                        <label className="text-sm font-medium text-[#010440]">
                            Section
                            <input
                                list="member-section-options"
                                value={data.section}
                                onChange={(event) => setData('section', event.target.value)}
                                className={inputClass}
                                placeholder="Choose or type a new section"
                            />
                            <datalist id="member-section-options">
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
                        <span className="truncate">{data.photo_file?.name ?? (member?.photo_url ? 'Keep current photo' : 'Choose photo')}</span>
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
                <input type="checkbox" checked={data.is_active} onChange={(event) => setData('is_active', event.target.checked)} className="size-4 rounded border-[#040DBF]/20" />
                Active member
            </label>
            {fieldError(errors.is_active)}
        </section>
    );
}

function TypeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof GraduationCap; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition ${
                active ? 'border-[#040DBF] bg-[#040DBF] text-white' : 'border-[#040DBF]/15 bg-white text-[#020659] hover:bg-[#f6f8ff]'
            }`}
        >
            <Icon className="size-4" />
            {label}
        </button>
    );
}

function fieldError(error?: string) {
    return error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null;
}
