import { Search, X } from 'lucide-react';

export function ImportPreviewSearch({
    value,
    displayedCount,
    totalCount,
    onChange,
}: {
    value: string;
    displayedCount: number;
    totalCount: number;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="relative min-w-0">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Search name, school ID, or RFID"
                    className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-9 pl-9 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                        title="Clear search"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>
            <p className="text-xs text-zinc-500">
                Showing {displayedCount} of {totalCount}
            </p>
        </div>
    );
}
