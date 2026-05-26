import { Link } from '@inertiajs/react';
import { Save } from 'lucide-react';

interface VisitorFormActionsProps {
    processing: boolean;
}

export function VisitorFormActions({ processing }: VisitorFormActionsProps) {
    return (
        <div className="flex justify-end gap-2">
            <Link
                href="/admin/registered-visitors/students"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
                Cancel
            </Link>
            <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
                <Save className="size-4" />
                Save visitor
            </button>
        </div>
    );
}
