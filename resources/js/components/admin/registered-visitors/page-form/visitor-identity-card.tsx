import { visitorPageInputClass, type VisitorPageFormData } from '@/components/admin/registered-visitors/page-form/visitor-page-form-state';
import { BriefcaseBusiness, GraduationCap, RadioTower } from 'lucide-react';

interface VisitorIdentityCardProps {
    data: VisitorPageFormData;
    errors: Partial<Record<keyof VisitorPageFormData, string>>;
    isEditing: boolean;
    scanStatus: string;
    onRfidChange: (value: string) => void;
    onRfidCapture: () => void;
    onFieldChange: (field: keyof VisitorPageFormData, value: VisitorPageFormData[keyof VisitorPageFormData]) => void;
    onTypeChange: (type: VisitorPageFormData['type']) => void;
}

export function VisitorIdentityCard({
    data,
    errors,
    isEditing,
    scanStatus,
    onRfidChange,
    onRfidCapture,
    onFieldChange,
    onTypeChange,
}: VisitorIdentityCardProps) {
    return (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
                    <RadioTower className="size-5" />
                </div>
                <div>
                    <h2 className="font-semibold">RFID identity</h2>
                    <p className="text-sm text-zinc-500">{scanStatus}</p>
                </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label className="text-sm font-medium">
                    RFID Unique ID
                    <input
                        data-rfid-input="true"
                        value={data.rfid_uid}
                        onChange={(event) => onRfidChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                onRfidCapture();
                            }
                        }}
                        placeholder="Scan or enter RFID"
                        className={visitorPageInputClass}
                        autoComplete="off"
                        autoFocus={!isEditing}
                        disabled={isEditing}
                    />
                    {fieldError(errors.rfid_uid)}
                </label>
                <label className="text-sm font-medium">
                    School ID
                    <input
                        value={data.school_id}
                        onChange={(event) => onFieldChange('school_id', event.target.value)}
                        className={visitorPageInputClass}
                        disabled={isEditing}
                    />
                    {fieldError(errors.school_id)}
                </label>
                <VisitorTypePicker type={data.type} onChange={onTypeChange} />
            </div>
        </section>
    );
}

function VisitorTypePicker({ type, onChange }: { type: VisitorPageFormData['type']; onChange: (type: VisitorPageFormData['type']) => void }) {
    return (
        <div className="text-sm font-medium">
            Visitor type
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                <VisitorTypeButton active={type === 'student'} icon={GraduationCap} label="Student" onClick={() => onChange('student')} />
                <VisitorTypeButton active={type === 'employee'} icon={BriefcaseBusiness} label="Employee" onClick={() => onChange('employee')} />
            </div>
        </div>
    );
}

function VisitorTypeButton({
    active,
    icon: Icon,
    label,
    onClick,
}: {
    active: boolean;
    icon: typeof GraduationCap;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition ${
                active ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
            }`}
        >
            <Icon className="size-4" />
            {label}
        </button>
    );
}

function fieldError(error?: string) {
    return error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null;
}
