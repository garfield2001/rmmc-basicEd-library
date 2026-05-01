import type { AdminPageHeaderProps } from './types';

export function AdminPageHeader({ title, description, badge, actions }: AdminPageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
                {badge && <div className="mb-4">{badge}</div>}
                <h1 className="text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>
            </div>

            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}
