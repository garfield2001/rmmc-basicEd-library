import { ADMIN_ROUTE_PRELOADER_MINIMUM_MS } from '@/config/timing';
import { type SharedData } from '@/types/shared';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const LOGIN_SUCCESS_MESSAGE = 'Admin session started.';

export function AdminRoutePreloader() {
    const { flash } = usePage<SharedData>().props;
    const shouldShowLoginPreloader = flash.success === LOGIN_SUCCESS_MESSAGE;
    const [visible, setVisible] = useState(shouldShowLoginPreloader);

    useEffect(() => {
        if (!shouldShowLoginPreloader) {
            setVisible(false);
            return;
        }

        setVisible(true);

        if (ADMIN_ROUTE_PRELOADER_MINIMUM_MS <= 0) {
            const animationFrame = window.requestAnimationFrame(() => setVisible(false));

            return () => window.cancelAnimationFrame(animationFrame);
        }

        const hideTimer = window.setTimeout(() => setVisible(false), ADMIN_ROUTE_PRELOADER_MINIMUM_MS);

        return () => {
            window.clearTimeout(hideTimer);
        };
    }, [shouldShowLoginPreloader]);

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white text-[#010440]" role="status" aria-live="polite">
            <div className="w-[min(88vw,440px)] text-center">
                <p className="text-xs font-semibold tracking-[0.24em] text-[#030A8C] uppercase">RMMC Library Admin</p>
                <p className="mt-3 text-2xl font-semibold tracking-normal text-[#010440]">Preparing workspace</p>
                <div className="mt-6 overflow-hidden rounded-full border border-[#040DBF]/15 bg-[#f6f8ff] p-1 shadow-sm shadow-[#010440]/5">
                    <div className="route-preloader h-2 w-1/2 rounded-full bg-[linear-gradient(90deg,#040DBF_0%,#030A8C_55%,#010440_100%)]" />
                </div>
                <p className="mt-3 text-sm text-[#030A8C]">Signing you in to the admin workspace.</p>
            </div>
        </div>
    );
}
