import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { forwardRef, type KeyboardEvent, useMemo, useState } from 'react';

export interface ScanLookupOption {
    value: string;
    label: string;
    idTerms: string[];
    meta: string;
    textTerms: string[];
}

interface ScanLookupInputProps {
    id: string;
    value: string;
    options: ScanLookupOption[];
    placeholder: string;
    onChange: (value: string) => void;
    className?: string;
    autoFocus?: boolean;
    loading?: boolean;
}

export const ScanLookupInput = forwardRef<HTMLInputElement, ScanLookupInputProps>(function ScanLookupInput(
    { id, value, options, placeholder, onChange, className, autoFocus = false, loading = false },
    ref,
) {
    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const normalizedValue = value.trim().toLowerCase();
    const filteredOptions = useMemo(() => {
        if (normalizedValue.length < 1) {
            return [];
        }

        return options
            .filter((option) => {
                const matchesText = option.textTerms.some((term) => term.toLowerCase().includes(normalizedValue));
                const matchesId = option.idTerms.some((term) => term.toLowerCase().startsWith(normalizedValue));

                return matchesText || matchesId;
            })
            .slice(0, 8);
    }, [normalizedValue, options]);
    const shouldShowOptions = isFocused && (filteredOptions.length > 0 || loading);

    const selectOption = (option: ScanLookupOption) => {
        onChange(option.value);
        setActiveIndex(-1);
    };

    const formatTypedValue = (nextValue: string): string =>
        nextValue.replace(/(^|\s)([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!shouldShowOptions) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % filteredOptions.length);
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => (current <= 0 ? filteredOptions.length - 1 : current - 1));
        }

        if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            selectOption(filteredOptions[activeIndex]);
        }

        if (event.key === 'Escape') {
            setIsFocused(false);
            setActiveIndex(-1);
        }
    };

    return (
        <div className={cn('relative flex-1', className)}>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
                id={id}
                ref={ref}
                data-rfid-scan-input="true"
                type="text"
                value={value}
                onChange={(event) => {
                    onChange(formatTypedValue(event.target.value));
                    setActiveIndex(-1);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn(
                    'h-11 w-full rounded-lg border border-[#040DBF]/20 bg-white pl-9 text-sm text-[#010440] placeholder:text-slate-500 shadow-xs transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500',
                    value ? 'pr-24' : 'pr-3',
                )}
                autoComplete="off"
                autoFocus={autoFocus}
            />

            {value && (
                <button
                    type="button"
                    onClick={() => {
                        onChange('');
                        setActiveIndex(-1);
                    }}
                    className="absolute top-1/2 right-1.5 inline-flex h-8 -translate-y-1/2 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Clear search"
                >
                    <X className="size-4" />
                    <span>Clear</span>
                </button>
            )}

            {shouldShowOptions && (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-[#040DBF]/20 bg-white py-1 shadow-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    {loading ? (
                        <div className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">Searching registered visitors...</div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <button
                                key={`${option.value}-${option.label}`}
                                type="button"
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    selectOption(option);
                                }}
                                className={cn(
                                    'flex w-full cursor-pointer flex-col px-3 py-2 text-left text-sm transition',
                                    activeIndex === index ? 'bg-[#040DBF]/10 font-bold text-[#040DBF] dark:bg-sky-500/20 dark:text-sky-300' : 'text-[#010440] hover:bg-[#f6f8ff] dark:text-slate-200 dark:hover:bg-slate-700',
                                )}
                            >
                                <span className="font-semibold">{option.label}</span>
                                <span className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{option.meta}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
});
