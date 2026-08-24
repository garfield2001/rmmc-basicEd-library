import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface SingleSelectOption {
    value: string;
    label: string;
}

interface SingleSelectDropdownProps {
    value: string;
    options: SingleSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    onChange: (value: string) => void;
}

export function SingleSelectDropdown({
    value,
    options,
    placeholder = 'Select option',
    disabled = false,
    className,
    onChange,
}: SingleSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const selected = options.find((opt) => opt.value === value);

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
        <div ref={wrapperRef} className={cn('relative w-full min-w-0', className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-left text-sm text-[#010440] transition outline-none hover:border-[#040DBF]/25 focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={cn('truncate', !selected ? 'text-[#020659]/55' : 'font-medium')}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown className="size-4 shrink-0 text-[#020659]/55" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1.5 w-full min-w-[200px] overflow-hidden rounded-xl border border-[#040DBF]/15 bg-white text-[#010440] shadow-xl">
                    <div role="listbox" className="max-h-60 overflow-y-auto p-1 text-xs">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        'flex h-8.5 w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-xs transition',
                                        isSelected
                                            ? 'bg-[#040DBF]/10 font-bold text-[#040DBF]'
                                            : 'text-[#010440] hover:bg-[#f6f8ff]',
                                    )}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && <Check className="size-3.5 shrink-0 text-[#040DBF]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
