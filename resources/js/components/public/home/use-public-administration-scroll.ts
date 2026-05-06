import { useEffect, useRef, useState, type RefObject } from 'react';
import { administrationRevealDistance, publicScrollDeltaPerStep } from './constants';

interface UsePublicAdministrationScrollOptions {
    loginOpen: boolean;
    scannerInputRef: RefObject<HTMLInputElement | null>;
}

export function usePublicAdministrationScroll({ loginOpen, scannerInputRef }: UsePublicAdministrationScrollOptions) {
    const [isAdministrationRevealed, setIsAdministrationRevealed] = useState(false);
    const [showAdministrationScrollHint, setShowAdministrationScrollHint] = useState(false);
    const [showScannerReturnButton, setShowScannerReturnButton] = useState(false);
    const administrationSectionRef = useRef<HTMLElement | null>(null);
    const isTransitioningRef = useRef(false);
    const scrollStepRef = useRef(0);
    const scrollAmountRef = useRef(0);
    const transitionTimerRef = useRef<number | null>(null);
    const returnButtonTimerRef = useRef<number | null>(null);

    const clearTransitionTimer = () => {
        if (transitionTimerRef.current) {
            window.clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }
    };

    const returnToScanner = () => {
        clearTransitionTimer();

        isTransitioningRef.current = true;
        scrollStepRef.current = 0;
        scrollAmountRef.current = 0;
        setIsAdministrationRevealed(false);
        setShowAdministrationScrollHint(false);
        setShowScannerReturnButton(false);
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });

        transitionTimerRef.current = window.setTimeout(() => {
            isTransitioningRef.current = false;
            scannerInputRef.current?.focus();
        }, 850);
    };

    useEffect(() => {
        return () => {
            clearTransitionTimer();

            if (returnButtonTimerRef.current) {
                window.clearTimeout(returnButtonTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (returnButtonTimerRef.current) {
            window.clearTimeout(returnButtonTimerRef.current);
        }

        if (!isAdministrationRevealed) {
            setShowScannerReturnButton(false);
            return;
        }

        returnButtonTimerRef.current = window.setTimeout(() => {
            setShowScannerReturnButton(true);
        }, 760);
    }, [isAdministrationRevealed]);

    useEffect(() => {
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
    }, [isAdministrationRevealed]);

    useEffect(() => {
        const finishTransition = (delayMs = 850) => {
            clearTransitionTimer();

            transitionTimerRef.current = window.setTimeout(() => {
                isTransitioningRef.current = false;
            }, delayMs);
        };

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

        const getWheelScrollSteps = (event: WheelEvent) => {
            if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
                return Math.abs(event.deltaY) / 3;
            }

            if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
                return Math.abs(event.deltaY) * 2;
            }

            return Math.abs(event.deltaY) / publicScrollDeltaPerStep;
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

                scrollAmountRef.current += getWheelScrollSteps(event);

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
    }, [isAdministrationRevealed, loginOpen, showAdministrationScrollHint]);

    return {
        administrationSectionRef,
        isAdministrationRevealed,
        showAdministrationScrollHint,
        showScannerReturnButton,
        returnToScanner,
    };
}
