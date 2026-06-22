import * as React from 'react';

import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
    return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />;
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
    return <thead className={cn('admin-table-header [&_tr]:border-b', className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
    return <tbody className={cn('[&_tr]:h-[4.25rem] [&_tr:last-child]:border-0', className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
    return <tfoot className={cn('border-t bg-zinc-50 font-medium [&>tr]:last:border-b-0', className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
    return <tr className={cn('border-b transition-colors hover:bg-zinc-50', className)} {...props} />;
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
    return <th className={cn('h-11 px-5 text-left align-middle text-xs font-medium tracking-wide text-zinc-500 uppercase', className)} {...props} />;
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
    return <td className={cn('h-[4.25rem] px-5 py-3 align-middle', className)} {...props} />;
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
    return <caption className={cn('mt-4 text-sm text-zinc-500', className)} {...props} />;
}

function TablePlaceholderRows({
    rowCount,
    colSpan,
    label = '-',
}: {
    rowCount: number;
    colSpan: number;
    label?: string;
}) {
    if (rowCount <= 0) {
        return null;
    }

    return (
        <>
            {Array.from({ length: rowCount }).map((_, index) => (
                <TableRow key={`placeholder-${index}`} aria-hidden="true" className="h-[4.25rem] hover:bg-transparent">
                    <TableCell colSpan={colSpan} className="h-[4.25rem] py-3 text-center text-sm text-[#020659]/35 dark:text-slate-400/45">
                        {label}
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TablePlaceholderRows, TableRow };
