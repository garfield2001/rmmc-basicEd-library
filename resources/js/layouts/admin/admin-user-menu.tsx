import { type SharedData } from '@/types/shared';
import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface AdminUserMenuProps {
    active: string;
    collapsed: boolean;
    sidebarLabel: string;
    sidebarMotion: string;
    sidebarRowWidth: string;
    onNavigate?: () => void;
}

export function AdminUserMenu({ active, collapsed, sidebarLabel, sidebarMotion, sidebarRowWidth, onNavigate }: AdminUserMenuProps) {
    const { auth } = usePage<SharedData>().props;
    const [open, setOpen] = useState(false);
    const [canPortal, setCanPortal] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ left: 0, bottom: 0, width: 0 });
    const menuRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const adminTools = [{ label: 'Settings', href: '/admin/settings', icon: Settings, active: active === 'settings' }];

    useEffect(() => {
        setCanPortal(true);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        const updatePosition = () => {
            const rect = triggerRef.current?.getBoundingClientRect();

            if (!rect) {
                return;
            }

            setMenuPosition({
                left: rect.left,
                bottom: Math.max(16, window.innerHeight - rect.top + 8),
                width: rect.width,
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const closeMenu = (event: PointerEvent) => {
            const target = event.target as Node;

            if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
                setOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);

        document.addEventListener('pointerdown', closeMenu);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('pointerdown', closeMenu);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    const logout = () => {
        setOpen(false);
        onNavigate?.();
        router.post('/logout');
    };

    return (
        <div ref={menuRef} className="relative mt-4 border-t border-[#040DBF]/10 pt-4">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={`flex h-11 ${sidebarRowWidth} items-center overflow-hidden rounded-lg border border-transparent text-left text-[#020659] transition-[width,background-color,border-color,color,box-shadow] ${sidebarMotion} hover:border-[#040DBF]/15 hover:bg-[#040DBF]/5 hover:text-[#040DBF]`}
                title={collapsed ? `${auth.user?.name ?? 'Admin'} menu` : undefined}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f6f8ff] text-sm font-semibold text-[#030A8C]">
                    {(auth.user?.name ?? 'A').trim().charAt(0).toUpperCase()}
                </span>
                <span className={`${sidebarLabel} grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_1.5rem] items-center gap-2 pr-1 pl-3`}>
                    <span className="min-w-0 leading-5">
                        <span className="block truncate text-xs font-semibold text-[#010440]">{auth.user?.name}</span>
                        <span className="block truncate text-xs text-[#030A8C] capitalize">{auth.user?.role}</span>
                    </span>
                    <ChevronDown
                        className={`mx-auto size-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                </span>
            </button>

            {canPortal &&
                open &&
                createPortal(
                    <>
                        <div className="admin-floating-scrim fixed inset-0 z-[51] bg-[#010440]/10 backdrop-blur-[3px]" aria-hidden="true" />
                        <div
                            ref={menuRef}
                            className="admin-floating-popover fixed z-[52] rounded-lg border border-[#040DBF]/10 bg-white/95 p-1 shadow-lg shadow-[#040DBF]/10 backdrop-blur-md"
                            style={{
                                left: menuPosition.left,
                                bottom: menuPosition.bottom,
                                width: collapsed ? Math.max(44, menuPosition.width) : menuPosition.width,
                            }}
                            role="menu"
                        >
                            {adminTools.map((tool) => {
                                const Icon = tool.icon;

                                return (
                                    <Link
                                        key={tool.href}
                                        href={tool.href}
                                        onClick={() => {
                                            setOpen(false);
                                            onNavigate?.();
                                        }}
                                        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-[background-color,border-color,color,box-shadow] ${
                                            tool.active
                                                ? 'border-[#040DBF] bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/20 hover:bg-[#030A8C]'
                                                : 'border-transparent text-[#020659] hover:border-[#040DBF]/15 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm'
                                        } ${collapsed ? 'lg:size-10 lg:justify-center lg:px-0' : ''}`}
                                        role="menuitem"
                                        title={collapsed ? tool.label : undefined}
                                    >
                                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                                        <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{tool.label}</span>
                                    </Link>
                                );
                            })}
                            <button
                                type="button"
                                onClick={logout}
                                className={`flex h-10 w-full items-center gap-2 rounded-md border border-transparent px-3 text-left text-sm font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/15 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm ${collapsed ? 'lg:size-10 lg:justify-center lg:px-0' : ''}`}
                                role="menuitem"
                                title={collapsed ? 'Log out' : undefined}
                            >
                                <LogOut className="size-4 shrink-0" aria-hidden="true" />
                                <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>Log out</span>
                            </button>
                        </div>
                    </>,
                    document.body,
                )}
        </div>
    );
}
