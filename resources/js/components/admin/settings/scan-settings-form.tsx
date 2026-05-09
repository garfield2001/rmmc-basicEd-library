import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/icon-badge';
import { useForm } from '@inertiajs/react';
import { RadioTower, Save } from 'lucide-react';
import type { FormEventHandler } from 'react';

export interface ScanSettings {
    repeat_scan_interval_hours: number;
    scan_starts_at: string;
    scan_ends_at: string;
}

interface ScanSettingsFormProps {
    settings: ScanSettings;
}

export function ScanSettingsForm({ settings }: ScanSettingsFormProps) {
    const { data, setData, patch, processing, errors } = useForm<ScanSettings>({
        repeat_scan_interval_hours: settings.repeat_scan_interval_hours,
        scan_starts_at: settings.scan_starts_at,
        scan_ends_at: settings.scan_ends_at,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        patch('/admin/scan-settings', {
            preserveScroll: true,
        });
    };

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <IconBadge icon={RadioTower} className="bg-[#040DBF] text-white" />
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Scan rules</h2>
                    <p className="text-sm text-[#020659]/70">Set the repeat-scan interval and the daily visit scanning window.</p>
                </div>
            </div>

            <form onSubmit={submit} className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
                <label className="text-sm font-medium text-[#010440]">
                    Repeat scan interval
                    <div className="mt-2 flex h-10 overflow-hidden rounded-lg border border-[#040DBF]/15 bg-white focus-within:border-[#040DBF] focus-within:ring-4 focus-within:ring-[#040DBF]/10">
                        <input
                            type="number"
                            min="1"
                            max="24"
                            value={data.repeat_scan_interval_hours}
                            onChange={(event) => setData('repeat_scan_interval_hours', Number(event.target.value))}
                            className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#010440] outline-none"
                        />
                        <span className="flex items-center border-l border-[#040DBF]/10 bg-[#f6f8ff] px-3 text-sm font-medium text-[#030A8C]">
                            hours
                        </span>
                    </div>
                    {errors.repeat_scan_interval_hours && <p className="mt-2 text-sm text-red-600">{errors.repeat_scan_interval_hours}</p>}
                </label>

                <TimeField
                    label="Scan opens"
                    value={data.scan_starts_at}
                    error={errors.scan_starts_at}
                    onChange={(value) => setData('scan_starts_at', value)}
                />
                <TimeField
                    label="Scan closes"
                    value={data.scan_ends_at}
                    error={errors.scan_ends_at}
                    onChange={(value) => setData('scan_ends_at', value)}
                />

                <Button type="submit" disabled={processing}>
                    <Save className="size-4" />
                    {processing ? 'Saving...' : 'Save rules'}
                </Button>
            </form>
        </section>
    );
}

function TimeField({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (value: string) => void }) {
    return (
        <label className="text-sm font-medium text-[#010440]">
            {label}
            <input
                type="time"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </label>
    );
}
