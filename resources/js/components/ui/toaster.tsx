import { type SharedData } from '@/types/shared';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

type ToastKind = 'success' | 'loading' | 'error';
const hiddenFlashSuccessMessages = ['Admin session started.'];
const hiddenFlashRecentVisitUrls = ['/'];

interface Toast {
    id: number;
    title: string;
    description?: string;
    kind: ToastKind;
}

interface ToastContextValue {
    notify: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used inside ToastProvider.');
    }

    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const page = usePage<SharedData>();
    const { flash } = page.props;
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const notify = useCallback(
        (toast: Omit<Toast, 'id'>) => {
            const id = Date.now();
            setToasts((current) => [...current, { ...toast, id }].slice(-3));
            window.setTimeout(() => dismiss(id), toast.kind === 'loading' ? 1800 : 3600);
        },
        [dismiss],
    );

    useEffect(() => {
        if (flash.success && !hiddenFlashSuccessMessages.includes(flash.success)) {
            notify({
                kind: 'success',
                title: flash.success,
            });
        }
    }, [flash.success, notify]);

    useEffect(() => {
        if (flash.error) {
            notify({
                kind: 'error',
                title: flash.error,
            });
        }
    }, [flash.error, notify]);

    useEffect(() => {
        if (!flash.recentVisit || hiddenFlashRecentVisitUrls.includes(page.url)) {
            return;
        }

        notify({
            kind: 'success',
            title: 'Library visit recorded.',
            description: `${flash.recentVisit.member.name ?? 'The scanned visitor'} was added to today's live visits.`,
        });
    }, [flash.recentVisit, notify, page.url]);

    return (
        <ToastContext.Provider value={{ notify }}>
            {children}
            <div className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
                {toasts.map((toast) => {
                    const Icon = toast.kind === 'loading' ? Loader2 : toast.kind === 'error' ? AlertCircle : CheckCircle2;
                    const tone =
                        toast.kind === 'error'
                            ? {
                                  shell: 'border-red-200 bg-red-50/95 shadow-red-950/10',
                                  icon: 'bg-red-600 text-white shadow-red-600/20',
                                  title: 'text-red-950',
                                  description: 'text-red-800/75',
                                  close: 'text-red-500 hover:bg-red-100 hover:text-red-700',
                              }
                            : toast.kind === 'loading'
                              ? {
                                    shell: 'border-[#030A8C]/20 bg-[#f6f8ff]/95 shadow-[#010440]/10',
                                    icon: 'bg-[#030A8C] text-white shadow-[#030A8C]/20',
                                    title: 'text-[#010440]',
                                    description: 'text-[#020659]/70',
                                    close: 'text-[#030A8C]/60 hover:bg-[#040DBF]/10 hover:text-[#030A8C]',
                                }
                              : {
                                    shell: 'border-[#040DBF]/20 bg-white/95 shadow-[#010440]/10',
                                    icon: 'bg-[#040DBF] text-white shadow-[#040DBF]/20',
                                    title: 'text-[#010440]',
                                    description: 'text-[#020659]/70',
                                    close: 'text-[#030A8C]/60 hover:bg-[#040DBF]/10 hover:text-[#030A8C]',
                                };

                    return (
                        <div
                            key={toast.id}
                            className={`toast-enter pointer-events-auto overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur ${tone.shell}`}
                        >
                            <div className="flex gap-3">
                                <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${tone.icon}`}>
                                    <Icon className={`size-4 ${toast.kind === 'loading' ? 'animate-spin' : ''}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold ${tone.title}`}>{toast.title}</p>
                                    {toast.description && <p className={`mt-1 text-sm leading-5 ${tone.description}`}>{toast.description}</p>}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => dismiss(toast.id)}
                                    className={`flex size-7 shrink-0 items-center justify-center rounded-md transition ${tone.close}`}
                                    aria-label="Dismiss notification"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
