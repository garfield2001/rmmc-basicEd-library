import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface IconBadgeProps {
    icon: LucideIcon;
    className?: string;
    iconClassName?: string;
}

export function IconBadge({ icon: Icon, className, iconClassName }: IconBadgeProps) {
    return (
        <span
            className={cn(
                'admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#040DBF]/15 bg-[#040DBF]/10 text-[#040DBF]',
                className,
            )}
        >
            <Icon className={cn('size-5', iconClassName)} />
        </span>
    );
}
