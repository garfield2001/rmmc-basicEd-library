import { Button } from '@/components/ui/button';
import { DateInput, formatDisplayDate } from '@/components/ui/date-input';
import { IconBadge } from '@/components/ui/icon-badge';
import type { SchoolYearRow } from '@/types/school-year';
import { router, useForm } from '@inertiajs/react';
import { CalendarClock, CheckCircle2, Plus } from 'lucide-react';
import type React from 'react';
import type { FormEventHandler } from 'react';

interface SchoolYearSettingsProps {
    schoolYears: SchoolYearRow[];
    stats: {
        studentVisitors: number;
        activeRegistrations: number;
    };
}

interface SchoolYearForm {
    [key: string]: string | number | boolean | null;
    name: string;
    starts_at: string;
    ends_at: string;
    minimum_visits: number;
    target_visits: number;
    make_active: boolean;
}

export function SchoolYearSettings({ schoolYears, stats }: SchoolYearSettingsProps) {
    const activeSchoolYear = schoolYears.find((schoolYear) => schoolYear.is_active);
    const { data, setData, post, processing, errors, reset } = useForm<SchoolYearForm>({
        name: '',
        starts_at: '',
        ends_at: '',
        minimum_visits: activeSchoolYear?.minimum_visits ?? 3,
        target_visits: activeSchoolYear?.target_visits ?? 4,
        make_active: true,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post('/admin/school-years', {
            preserveScroll: true,
            onSuccess: () => reset('name', 'starts_at', 'ends_at'),
        });
    };

    const activate = (schoolYear: SchoolYearRow) => {
        router.patch(`/admin/school-years/${schoolYear.id}/activate`, {}, { preserveScroll: true });
    };

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center gap-3">
                    <IconBadge icon={CalendarClock} />
                    <div>
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">School years</h2>
                        <p className="text-sm text-[#020659]/70">
                            Create a school year to automatically promote existing students with blank sections.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <Stat label="Students" value={stats.studentVisitors} />
                    <Stat label="Active Student registrations" value={stats.activeRegistrations} />
                </div>
            </div>

            <form onSubmit={submit} className="mt-6 grid gap-4 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4 md:grid-cols-2 xl:grid-cols-6">
                <Field label="Name" error={errors.name} className="lg:col-span-2">
                    <input
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="2027-2028"
                        className={inputClass}
                    />
                </Field>
                <Field label="Start" error={errors.starts_at}>
                    <DateInput value={data.starts_at} onChange={(value) => setData('starts_at', value)} className="mt-2" />
                </Field>
                <Field label="End" error={errors.ends_at}>
                    <DateInput value={data.ends_at} onChange={(value) => setData('ends_at', value)} className="mt-2" />
                </Field>
                <Field label="Minimum" error={errors.minimum_visits}>
                    <input
                        type="number"
                        min="0"
                        value={data.minimum_visits}
                        onChange={(event) => setData('minimum_visits', Number(event.target.value))}
                        className={inputClass}
                    />
                </Field>
                <Field label="Target" error={errors.target_visits}>
                    <input
                        type="number"
                        min="0"
                        value={data.target_visits}
                        onChange={(event) => setData('target_visits', Number(event.target.value))}
                        className={inputClass}
                    />
                </Field>
                <label className="flex items-center gap-2 self-end text-sm font-medium text-[#010440] lg:col-span-2">
                    <input
                        type="checkbox"
                        checked={data.make_active}
                        onChange={(event) => setData('make_active', event.target.checked)}
                        className="size-4 rounded border-[#040DBF]/20"
                    />
                    Set as active
                </label>
                <div className="self-end lg:col-span-1">
                    <Button type="submit" disabled={processing} className="w-full">
                        <Plus className="size-4" />
                        Create
                    </Button>
                </div>
            </form>

            <div className="mt-5 max-h-128 overflow-y-auto rounded-lg border border-[#040DBF]/10">
                {schoolYears.map((schoolYear) => (
                    <div
                        key={schoolYear.id}
                        className="flex flex-col gap-3 border-b border-[#040DBF]/10 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-[#010440]">{schoolYear.name}</p>
                                {schoolYear.is_active && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                        <CheckCircle2 className="size-3.5" />
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-[#020659]/70">
                                {formatDisplayDate(schoolYear.starts_at)} to {formatDisplayDate(schoolYear.ends_at)}
                            </p>
                        </div>
                        {!schoolYear.is_active && (
                            <Button type="button" variant="outline" onClick={() => activate(schoolYear)}>
                                Make active
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

const inputClass =
    'mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10';

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
    return (
        <label className={`text-sm font-medium text-[#010440] ${className ?? ''}`}>
            {label}
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </label>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3 py-2">
            <p className="text-xs font-medium text-[#030A8C]">{label}</p>
            <p className="text-lg font-semibold text-[#010440]">{value.toLocaleString()}</p>
        </div>
    );
}
