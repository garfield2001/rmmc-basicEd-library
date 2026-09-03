import { cn } from '@/lib/utils';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    value: string;
    options: SearchableSelectOption[];
    placeholder: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    className?: string;
    onChange: (value: string) => void;
}

export function SearchableSelect({ value, options, placeholder, searchPlaceholder, disabled = false, className, onChange }: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const selected = options.find((option) => option.value === value);
    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return normalizedQuery
            ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
            : options;
    }, [options, query]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);

        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, []);

    return (
        <div ref={wrapperRef} className={cn('relative w-full', className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#040DBF]/20 bg-white px-3 text-left text-sm text-[#010440] shadow-xs transition outline-none hover:border-[#040DBF]/40 focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={cn('truncate font-medium', !selected ? 'text-slate-600 font-normal dark:text-slate-400' : 'text-[#010440] dark:text-white')}>{selected?.label ?? placeholder}</span>
                <ChevronDown className="size-4 shrink-0 text-slate-500 dark:text-slate-400" />
            </button>

            {open && (
                <div className="admin-contained-scroll absolute z-50 mt-2 w-full min-w-56 overflow-hidden rounded-xl border border-[#040DBF]/20 bg-white text-[#010440] shadow-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <div className="relative border-b border-[#040DBF]/10 p-2 dark:border-slate-700">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={searchPlaceholder ?? 'Search options'}
                            className="h-9 w-full rounded-md border border-[#040DBF]/15 bg-white pr-3 pl-9 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            autoFocus
                        />
                    </div>
                    <div role="listbox" className="admin-contained-scroll max-h-48 overflow-y-auto overscroll-contain p-1">
                        {filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={option.value === value}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                    setQuery('');
                                }}
                                className={cn(
                                    'flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition hover:bg-[#f6f8ff] dark:hover:bg-slate-700',
                                    option.value === value ? 'font-bold text-[#040DBF] dark:text-sky-300' : 'text-slate-700 dark:text-slate-200',
                                )}
                            >
                                <span className="min-w-0 truncate">{option.label}</span>
                                {option.value === value && <Check className="size-4 shrink-0 text-[#040DBF] dark:text-sky-400" />}
                            </button>
                        ))}
                        {filteredOptions.length === 0 && <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">No options found.</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
