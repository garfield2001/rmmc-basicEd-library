import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';

interface UseNativeAdministrationScrollOptions {
    enabled: boolean;
    administrationSectionRef: RefObject<HTMLElement | null>;
    setIsAdministrationRevealed: Dispatch<SetStateAction<boolean>>;
    setShowAdministrationScrollHint: Dispatch<SetStateAction<boolean>>;
}

export function useNativeAdministrationScroll({
    enabled,
    administrationSectionRef,
    setIsAdministrationRevealed,
    setShowAdministrationScrollHint,
}: UseNativeAdministrationScrollOptions) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        setShowAdministrationScrollHint(false);

        const syncRevealedState = () => {
            const top = administrationSectionRef.current?.getBoundingClientRect().top;

            if (top === undefined) {
                return;
            }

            setIsAdministrationRevealed(top <= window.innerHeight * 0.72);
        };

        syncRevealedState();
        window.addEventListener('scroll', syncRevealedState, { passive: true });
        window.addEventListener('resize', syncRevealedState);

        return () => {
            window.removeEventListener('scroll', syncRevealedState);
            window.removeEventListener('resize', syncRevealedState);
        };
    }, [administrationSectionRef, enabled, setIsAdministrationRevealed, setShowAdministrationScrollHint]);
}
