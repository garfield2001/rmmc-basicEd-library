import type { AdminPageHeaderProps } from './admin-layout.types';

export function AdminPageHeader({ title, description, badge, actions }: AdminPageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 text-left sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="admin-page-title text-2xl font-bold tracking-tight text-[#010440] dark:text-white sm:text-3xl">
                        {title}
                    </h1>
                    {badge}
                </div>
                <p className="admin-page-description max-w-4xl text-sm font-medium text-[#030A8C]/80 dark:text-slate-400">
                    {description}
                </p>
            </div>
            {actions && <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">{actions}</div>}
        </header>
    );
}
