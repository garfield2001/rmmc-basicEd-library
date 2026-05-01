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
}

export const ScanLookupInput = forwardRef<HTMLInputElement, ScanLookupInputProps>(function ScanLookupInput(
    { id, value, options, placeholder, onChange, className, autoFocus = false },
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
    const shouldShowOptions = isFocused && filteredOptions.length > 0;

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
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
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
                    'h-11 w-full rounded-lg border border-zinc-300 bg-white pl-9 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100',
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
                    className="absolute top-1/2 right-1.5 inline-flex h-8 -translate-y-1/2 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus:ring-2 focus:ring-zinc-300 focus:outline-none"
                    aria-label="Clear search"
                >
                    <X className="size-4" />
                    <span>Clear</span>
                </button>
            )}

            {shouldShowOptions && (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                    {filteredOptions.map((option, index) => (
                        <button
                            key={`${option.value}-${option.label}`}
                            type="button"
                            onMouseDown={(event) => {
                                event.preventDefault();
                                selectOption(option);
                            }}
                            className={cn(
                                'flex w-full cursor-pointer flex-col px-3 py-2 text-left text-sm transition',
                                activeIndex === index ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950',
                            )}
                        >
                            <span className="font-medium">{option.label}</span>
                            <span className="mt-0.5 truncate text-xs text-zinc-500">{option.meta}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});
