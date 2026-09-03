import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

let openDialogCount = 0;

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    React.useEffect(() => {
        if (!props.open) {
            return;
        }

        openDialogCount += 1;
        document.documentElement.classList.add('modal-scroll-locked');
        document.body.classList.add('modal-scroll-locked');

        return () => {
            openDialogCount = Math.max(0, openDialogCount - 1);

            if (openDialogCount === 0) {
                document.documentElement.classList.remove('modal-scroll-locked');
                document.body.classList.remove('modal-scroll-locked');
            }
        };
    }, [props.open]);

    return <DialogPrimitive.Root {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            aria-hidden="true"
            data-state="open"
            className={cn('dialog-overlay fixed inset-0 z-[80] bg-[#010440]/40 backdrop-blur-md dark:bg-black/60', className)}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    hideClose = false,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                className={cn(
                    'dialog-content fixed top-1/2 left-1/2 z-[90] grid w-[calc(100%-2rem)] max-w-lg gap-4 rounded-2xl border border-[#040DBF]/15 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 dark:text-white',
                    className,
                )}
                {...props}
            >
                {children}
                {!hideClose && (
                    <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm text-[#010440] opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-[#040DBF] focus:outline-none dark:text-slate-300 dark:hover:text-white">
                        <X className="size-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('flex flex-col gap-2 text-left', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return <DialogPrimitive.Title className={cn('text-lg leading-none font-bold text-[#010440] dark:text-white', className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return <DialogPrimitive.Description className={cn('text-xs font-medium leading-6 text-slate-600 dark:text-slate-400', className)} {...props} />;
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger };
