import { cn } from '@/lib/utils';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface MultiSelectDropdownOption {
    value: string;
    label: string;
}

interface MultiSelectDropdownProps {
    label: string;
    placeholder: string;
    values: string[];
    options: MultiSelectDropdownOption[];
    onChange: (values: string[]) => void;
    emptySelectionLabel?: string;
    searchPlaceholder?: string;
    className?: string;
}

export function MultiSelectDropdown({
    label,
    placeholder,
    values,
    options,
    onChange,
    emptySelectionLabel,
    searchPlaceholder,
    className,
}: MultiSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const selected = new Set(values);
    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return normalizedQuery ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery)) : options;
    }, [options, query]);
    const allSelected = options.length > 0 && values.length === options.length;
    const selectedLabel =
        values.length === 0
            ? (emptySelectionLabel ?? placeholder)
            : allSelected
              ? `All ${label.toLowerCase()}`
              : values.length === 1
                ? (options.find((option) => option.value === values[0])?.label ?? values[0])
                : `${values.length} selected`;

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
        <div ref={wrapperRef} className={cn('relative flex w-full min-w-0 flex-col gap-1.5', className)}>
            <label className="flex h-4 items-center truncate text-xs font-semibold leading-4 text-[#010440] dark:text-slate-200">{label}</label>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#040DBF]/20 bg-white px-3 text-left text-sm text-[#010440] shadow-xs transition outline-none hover:border-[#040DBF]/40 focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:border-slate-600"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={values.length === 0 ? 'truncate text-slate-600 font-normal dark:text-slate-400' : 'truncate font-medium text-[#010440] dark:text-white'}>{selectedLabel}</span>
                <ChevronDown className="size-4 shrink-0 text-slate-500 dark:text-slate-400" />
            </button>

            {open && (
                <div className="admin-contained-scroll absolute z-50 mt-2 w-full min-w-64 overflow-hidden rounded-xl border border-[#040DBF]/20 bg-white text-[#010440] shadow-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <div className="border-b border-[#040DBF]/10 p-2 dark:border-slate-700">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}`}
                                className="h-9 w-full rounded-md border border-[#040DBF]/15 bg-white pr-3 pl-9 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                autoFocus
                            />
                        </div>
                        <div className="mt-2 flex gap-1">
                            <button
                                type="button"
                                onClick={() => onChange(allSelected ? [] : options.map((option) => option.value))}
                                className="inline-flex h-8 items-center rounded-md border border-[#040DBF]/15 bg-[#f6f8ff] px-2 text-xs font-semibold text-[#030A8C] transition hover:bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-sky-300 dark:hover:bg-slate-600"
                            >
                                {allSelected ? 'Clear all' : 'Select all'}
                            </button>
                            {values.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onChange([])}
                                    className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-600 transition hover:bg-[#f6f8ff] hover:text-[#030A8C] dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    <X className="size-3.5" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    <div role="listbox" className="admin-contained-scroll max-h-56 overflow-y-auto overscroll-contain p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const checked = selected.has(option.value);

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="option"
                                        aria-selected={checked}
                                        onClick={() =>
                                            onChange(checked ? values.filter((value) => value !== option.value) : [...values, option.value])
                                        }
                                        className={cn(
                                            'flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition hover:bg-[#f6f8ff] dark:hover:bg-slate-700',
                                            checked ? 'font-semibold text-[#010440] dark:text-white' : 'text-slate-700 dark:text-slate-200',
                                        )}
                                    >
                                        <span className="min-w-0 truncate">{option.label}</span>
                                        <span
                                            className={cn(
                                                'inline-flex size-5 shrink-0 items-center justify-center rounded border',
                                                checked ? 'border-[#040DBF] bg-[#040DBF] text-white' : 'border-[#040DBF]/25 bg-white dark:border-slate-600 dark:bg-slate-900',
                                            )}
                                        >
                                            {checked && <Check className="size-3.5" />}
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">No options found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
