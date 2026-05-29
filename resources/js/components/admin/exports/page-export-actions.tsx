import { Button } from '@/components/ui/button';
import { ChevronDown, Download, FileDown, FileSpreadsheet, FileText, Printer, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PageExportActionsProps {
    page: 'visit-logs' | 'visit-progress' | 'registered-visitors';
    audience: 'students' | 'employees';
    query?: Record<string, string | number | null | undefined>;
}

const actions: Array<{ format: string; label: string; icon: LucideIcon; external?: boolean }> = [
    { format: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
    { format: 'docx', label: 'Word', icon: FileText },
    { format: 'pdf', label: 'PDF', icon: FileDown },
    { format: 'print', label: 'Print', icon: Printer, external: true },
];

export function PageExportActions({ page, audience, query = {} }: PageExportActionsProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const close = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', close);

        return () => document.removeEventListener('pointerdown', close);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full sm:w-auto">
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
            >
                <Download className="size-4" />
                Export
                <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
            {open && (
                <div className="admin-floating-popover absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-[#040DBF]/15 bg-white p-1 text-[#010440] shadow-xl shadow-[#010440]/10">
                    {actions.map((action) => {
                        const Icon = action.icon;

                        return (
                            <a
                                key={action.format}
                                href={exportUrl(page, audience, action.format, query)}
                                target={action.external ? '_blank' : undefined}
                                rel={action.external ? 'noreferrer' : undefined}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-[#f6f8ff] hover:text-[#040DBF]"
                            >
                                <Icon className="size-4" />
                                {action.label}
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function exportUrl(page: string, audience: string, format: string, query: PageExportActionsProps['query']) {
    const params = new URLSearchParams();

    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.set(key, String(value));
        }
    });

    const search = params.toString();

    return `/admin/${page}/${audience}/exports/${format}${search ? `?${search}` : ''}`;
}
