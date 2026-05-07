import type { AdminPageHeaderProps } from './admin-layout.types';

export function AdminPageHeader({ title, description, badge, actions }: AdminPageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="admin-page-title font-semibold tracking-normal text-zinc-950">{title}</h1>
                    {badge}
                </div>
                <p className="admin-page-description mt-2 max-w-4xl text-zinc-500">{description}</p>
            </div>
            {actions && <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">{actions}</div>}
        </header>
    );
}
