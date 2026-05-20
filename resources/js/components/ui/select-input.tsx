import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

const selectInputClass =
    'h-10 w-full appearance-none rounded-lg border border-[#040DBF]/15 bg-white py-2 pr-10 pl-3 text-sm text-[#010440] outline-none transition focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10 disabled:cursor-not-allowed disabled:opacity-60';

type SelectInputProps = React.ComponentProps<'select'> & {
    wrapperClassName?: string;
};

export function SelectInput({ className, wrapperClassName, children, ...props }: SelectInputProps) {
    return (
        <span className={cn('relative block w-full', wrapperClassName)}>
            <select className={cn(selectInputClass, className)} {...props}>
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#020659]/55" />
        </span>
    );
}
