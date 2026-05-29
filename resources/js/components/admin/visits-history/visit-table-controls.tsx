import { Search, X } from 'lucide-react';

export function VisitSortOptions() {
    return (
        <>
            <option value="lastVisit:desc">Newest first</option>
            <option value="lastVisit:asc">Oldest first</option>
            <option value="visitCount:desc">Most visits</option>
            <option value="visitCount:asc">Fewest visits</option>
            <option value="name:asc">Name A-Z</option>
            <option value="name:desc">Name Z-A</option>
        </>
    );
}

export function VisitStatusOptions() {
    return (
        <>
            <option value="all">All with visits</option>
            <option value="below">Below requirement</option>
            <option value="met">Met requirement</option>
            <option value="excess">Excess visits</option>
        </>
    );
}

export function VisitSearchControl({
    search,
    placeholder,
    className = 'md:col-span-2 2xl:col-span-1',
    onSearchChange,
}: {
    search: string;
    placeholder: string;
    className?: string;
    onSearchChange: (value: string) => void;
}) {
    return (
        <label className={`grid gap-1 text-xs font-semibold text-[#030A8C] ${className}`}>
            Search
            <span className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-9 pl-9 text-sm font-normal text-[#010440] transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#030A8C]/50 transition hover:bg-[#040DBF]/5 hover:text-[#010440]"
                        title="Clear search"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </span>
        </label>
    );
}
