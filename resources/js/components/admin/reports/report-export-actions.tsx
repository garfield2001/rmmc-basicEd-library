import { Button } from '@/components/ui/button';
import { Download, FileDown, FileSpreadsheet, FileText, Printer, type LucideIcon } from 'lucide-react';

interface ReportExportActionsProps {
    excelUrl: string;
    wordUrl: string;
    csvUrl: string;
    pdfUrl: string;
    printUrl: string;
}

const exportActions: Array<{
    key: keyof ReportExportActionsProps;
    label: string;
    icon: LucideIcon;
    external?: boolean;
}> = [
    { key: 'excelUrl', label: 'Excel', icon: FileSpreadsheet },
    { key: 'wordUrl', label: 'Word', icon: FileText },
    { key: 'csvUrl', label: 'CSV', icon: Download },
    { key: 'pdfUrl', label: 'PDF', icon: FileDown },
    { key: 'printUrl', label: 'Print', icon: Printer, external: true },
];

export function ReportExportActions(props: ReportExportActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {exportActions.map((action) => {
                const Icon = action.icon;

                return (
                    <Button key={action.key} asChild variant="outline" size="sm">
                        <a href={props[action.key]} target={action.external ? '_blank' : undefined} rel={action.external ? 'noreferrer' : undefined}>
                            <Icon className="size-4" />
                            {action.label}
                        </a>
                    </Button>
                );
            })}
        </div>
    );
}
