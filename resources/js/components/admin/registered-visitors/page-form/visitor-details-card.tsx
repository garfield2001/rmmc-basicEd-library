import { visitorPageInputClass, type VisitorPageFormData } from '@/components/admin/registered-visitors/page-form/visitor-page-form-state';
import { BriefcaseBusiness, GraduationCap } from 'lucide-react';

interface VisitorDetailsCardProps {
    data: VisitorPageFormData;
    errors: Partial<Record<keyof VisitorPageFormData, string>>;
    onFieldChange: (field: keyof VisitorPageFormData, value: VisitorPageFormData[keyof VisitorPageFormData]) => void;
}

export function VisitorDetailsCard({ data, errors, onFieldChange }: VisitorDetailsCardProps) {
    return data.type === 'student' ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-zinc-500" />
                <h2 className="font-semibold">Student details</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
                <VisitorTextField
                    label="Year level"
                    value={data.year_level}
                    error={errors.year_level}
                    onChange={(value) => onFieldChange('year_level', value)}
                />
                <VisitorTextField label="Section" value={data.section} error={errors.section} onChange={(value) => onFieldChange('section', value)} />
            </div>
        </section>
    ) : (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
                <BriefcaseBusiness className="size-5 text-zinc-500" />
                <h2 className="font-semibold">Employee details</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
                <VisitorTextField
                    label="Department"
                    value={data.department}
                    error={errors.department}
                    onChange={(value) => onFieldChange('department', value)}
                />
            </div>
        </section>
    );
}

function VisitorTextField({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (value: string) => void }) {
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
