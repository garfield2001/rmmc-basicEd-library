import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#040DBF] focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-[#040DBF] text-white hover:bg-[#030A8C]',
                secondary: 'bg-[#f6f8ff] text-[#020659] hover:bg-[#040DBF]/10 hover:text-[#030A8C]',
                outline: 'border border-[#040DBF]/15 bg-white text-[#020659] hover:border-[#040DBF]/30 hover:bg-[#f6f8ff] hover:text-[#030A8C]',
                ghost: 'text-[#020659] hover:bg-[#040DBF]/5 hover:text-[#030A8C]',
                danger: 'bg-red-600 text-white hover:bg-red-700',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 px-3',
                lg: 'h-11 px-5',
                icon: 'size-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : 'button';

    return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
