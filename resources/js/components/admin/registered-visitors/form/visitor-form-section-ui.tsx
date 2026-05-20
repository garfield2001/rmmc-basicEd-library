import { type LucideIcon } from 'lucide-react';

export function VisitorTypeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
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

export function fieldError(error?: string) {
    return error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null;
}
