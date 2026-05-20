import { useEffect } from 'react';
import { administrationRevealDistance } from './constants';
import { type WheelAdministrationScrollOptions } from './public-administration-scroll-types';
import { wheelScrollSteps } from './public-scroll-steps';
export function useWheelAdministrationScroll({
    enabled,
    loginOpen,
    isAdministrationRevealed,
    showAdministrationScrollHint,
    administrationSectionRef,
    isTransitioningRef,
    scrollAmountRef,
    scrollStepRef,
    finishTransition,
    setIsAdministrationRevealed,
    setShowAdministrationScrollHint,
}: WheelAdministrationScrollOptions) {
    useEffect(() => {
        if (!enabled) {
            return;
        }
        const previewAdministration = () => {
            isTransitioningRef.current = true;
            scrollStepRef.current = 1;
            setIsAdministrationRevealed(false);
            setShowAdministrationScrollHint(true);
            window.scrollTo({
                top: administrationRevealDistance,
                behavior: 'smooth',
            });
            finishTransition(420);
        };

        const revealAdministration = () => {
            isTransitioningRef.current = true;
            scrollStepRef.current = 2;
            scrollAmountRef.current = 2;
            setIsAdministrationRevealed(true);
            setShowAdministrationScrollHint(false);
            administrationSectionRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            finishTransition();
        };

        const hideAdministration = () => {
            isTransitioningRef.current = true;
            scrollStepRef.current = 0;
            scrollAmountRef.current = 0;
            setIsAdministrationRevealed(false);
            setShowAdministrationScrollHint(false);
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
            finishTransition();
        };

        const lockAdministrationPosition = () => {
            const administrationTop = administrationSectionRef.current?.offsetTop;

            if (administrationTop === undefined || Math.abs(window.scrollY - administrationTop) <= 2) {
                return;
            }

            window.scrollTo({
                top: administrationTop,
                behavior: 'auto',
            });
        };

        const handlePublicWheel = (event: WheelEvent) => {
            if (loginOpen) {
                event.preventDefault();
                return;
            }

            if (Math.abs(event.deltaY) < 2) {
                return;
            }

            event.preventDefault();

            if (event.deltaY > 0) {
                if (isAdministrationRevealed) {
                    lockAdministrationPosition();
                    return;
                }

                scrollAmountRef.current += wheelScrollSteps(event);

                if (
                    scrollAmountRef.current >= 2 ||
                    scrollStepRef.current >= 1 ||
                    showAdministrationScrollHint ||
                    window.scrollY >= administrationRevealDistance - 2
                ) {
                    revealAdministration();
                    return;
                }

                previewAdministration();
                return;
            }

            if (isAdministrationRevealed || showAdministrationScrollHint || window.scrollY > 2) {
                hideAdministration();
            }
        };

        const blockPublicTouchScroll = (event: TouchEvent) => {
            if (loginOpen) {
                event.preventDefault();
            }
        };

        const reconcilePublicScroll = () => {
            if (loginOpen || isTransitioningRef.current) {
                return;
            }

            if (isAdministrationRevealed) {
                lockAdministrationPosition();
                return;
            }

            if (!showAdministrationScrollHint && window.scrollY > 2) {
                window.scrollTo({
                    top: 0,
                    behavior: 'auto',
                });
            }
        };

        window.addEventListener('wheel', handlePublicWheel, { passive: false });
        window.addEventListener('touchmove', blockPublicTouchScroll, { passive: false });
        window.addEventListener('scroll', reconcilePublicScroll, { passive: true });

        return () => {
            window.removeEventListener('wheel', handlePublicWheel);
            window.removeEventListener('touchmove', blockPublicTouchScroll);
            window.removeEventListener('scroll', reconcilePublicScroll);
        };
    }, [
        administrationSectionRef,
        enabled,
        finishTransition,
        isAdministrationRevealed,
        isTransitioningRef,
        loginOpen,
        scrollAmountRef,
        scrollStepRef,
        setIsAdministrationRevealed,
        setShowAdministrationScrollHint,
        showAdministrationScrollHint,
    ]);
}
