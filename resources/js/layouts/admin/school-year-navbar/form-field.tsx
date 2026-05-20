import type React from 'react';

export const schoolYearInputClass =
    'mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10';

export function SchoolYearField({
    label,
    error,
    className,
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <label className={`text-sm font-medium text-[#010440] ${className ?? ''}`}>
            {label}
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </label>
    );
}
