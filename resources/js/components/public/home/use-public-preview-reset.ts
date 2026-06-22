import { useEffect, type Dispatch, type SetStateAction } from 'react';

interface UsePublicPreviewResetOptions {
    enabled: boolean;
    isAdministrationRevealed: boolean;
    setShowAdministrationScrollHint: Dispatch<SetStateAction<boolean>>;
}

export function usePublicPreviewReset({ enabled, isAdministrationRevealed, setShowAdministrationScrollHint }: UsePublicPreviewResetOptions) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        let resizeTimer: number | null = null;

        const resetPublicPreview = () => {
            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }

            resizeTimer = window.setTimeout(() => {
                if (isAdministrationRevealed) {
                    return;
                }

                setShowAdministrationScrollHint(false);
                window.scrollTo({
                    top: 0,
                    behavior: 'instant',
                });
            }, 80);
        };

        window.addEventListener('resize', resetPublicPreview);
        document.addEventListener('fullscreenchange', resetPublicPreview);

        return () => {
            window.removeEventListener('resize', resetPublicPreview);
            document.removeEventListener('fullscreenchange', resetPublicPreview);

            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }
        };
    }, [enabled, isAdministrationRevealed, setShowAdministrationScrollHint]);
}
