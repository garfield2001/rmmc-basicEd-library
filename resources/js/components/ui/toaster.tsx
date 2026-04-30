import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

type ToastKind = 'success' | 'loading';
const hiddenFlashSuccessMessages = ['Admin session started.'];

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
    const { flash } = usePage<SharedData>().props;
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

    return (
        <ToastContext.Provider value={{ notify }}>
            {children}
            <div className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
                {toasts.map((toast) => {
                    const Icon = toast.kind === 'loading' ? Loader2 : CheckCircle2;

                    return (
                        <div
                            key={toast.id}
                            className="toast-enter pointer-events-auto overflow-hidden rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-xl shadow-zinc-950/10 backdrop-blur"
                        >
                            <div className="flex gap-3">
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
                                    <Icon className={`size-4 ${toast.kind === 'loading' ? 'animate-spin' : ''}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-zinc-950">{toast.title}</p>
                                    {toast.description && <p className="mt-1 text-sm leading-5 text-zinc-500">{toast.description}</p>}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => dismiss(toast.id)}
                                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
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
