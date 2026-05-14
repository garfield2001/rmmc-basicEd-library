import { cn } from '@/lib/utils';

import { FallbackImage } from './fallback-image';

interface VisitorAvatarProps {
    name?: string | null;
    src?: string | null;
    className?: string;
}

export function VisitorAvatar({ name, src, className }: VisitorAvatarProps) {
    return (
        <div
            className={cn(
                'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-500',
                className,
            )}
        >
            <FallbackImage src={src} className="size-full object-cover" fallback={initialsFor(name)} />
        </div>
    );
}

export function initialsFor(name?: string | null) {
    const initials = (name ?? '')
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return initials || '?';
}
