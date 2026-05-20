import { visitorPageInputClass, type VisitorPageFormData } from '@/components/admin/registered-visitors/page-form/visitor-page-form-state';
import type { LibraryMemberRow } from '@/types/registered-visitors';

interface VisitorProfileCardProps {
    data: VisitorPageFormData;
    errors: Partial<Record<keyof VisitorPageFormData, string>>;
    visitor: LibraryMemberRow | null;
    onFieldChange: (field: keyof VisitorPageFormData, value: VisitorPageFormData[keyof VisitorPageFormData]) => void;
}

export function VisitorProfileCard({ data, errors, visitor, onFieldChange }: VisitorProfileCardProps) {
    return (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Profile</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
                <NameField label="First name" value={data.first_name} error={errors.first_name} onChange={(value) => onFieldChange('first_name', value)} />
                <NameField label="Middle name" value={data.middle_name} onChange={(value) => onFieldChange('middle_name', value)} />
                <NameField label="Last name" value={data.last_name} error={errors.last_name} onChange={(value) => onFieldChange('last_name', value)} />
                <div className="md:col-span-2">
                    <label className="text-sm font-medium">
                        Photo upload
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(event) => onFieldChange('photo_file', event.target.files?.[0] ?? null)}
                            className={`${visitorPageInputClass} file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white`}
                        />
                    </label>
                    {fieldError(errors.photo_file)}
                    {visitor?.photo_url && (
                        <div className="mt-3 inline-flex overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                            <img src={visitor.photo_url} alt={`${visitor.name} current photo`} className="size-20 rounded-md object-cover" />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function NameField({
    label,
    value,
    error,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="text-sm font-medium">
            {label}
            <input value={value} onChange={(event) => onChange(event.target.value)} className={visitorPageInputClass} />
            {fieldError(error)}
        </label>
    );
}

function fieldError(error?: string) {
    return error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null;
}
