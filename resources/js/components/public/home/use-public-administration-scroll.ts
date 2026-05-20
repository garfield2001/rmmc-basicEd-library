import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useNativeAdministrationScroll } from './use-native-administration-scroll';
import { usePublicPreviewReset } from './use-public-preview-reset';
import { usePublicTouchScrollMode } from './use-public-touch-scroll-mode';
import { useWheelAdministrationScroll } from './use-wheel-administration-scroll';

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
    const useNativeTouchScroll = usePublicTouchScrollMode();

    const clearTransitionTimer = useCallback(() => {
        if (transitionTimerRef.current) {
            window.clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }
    }, []);

    const finishTransition = useCallback(
        (delayMs = 850) => {
            clearTransitionTimer();

            transitionTimerRef.current = window.setTimeout(() => {
                isTransitioningRef.current = false;
            }, delayMs);
        },
        [clearTransitionTimer],
    );

    const returnToScanner = useCallback(() => {
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
    }, [clearTransitionTimer, scannerInputRef]);

    useEffect(() => clearTransitionTimer, [clearTransitionTimer]);

    useEffect(() => {
        if (!isAdministrationRevealed) {
            setShowScannerReturnButton(false);
            return;
        }

        const timer = window.setTimeout(() => {
            setShowScannerReturnButton(true);
        }, 760);

        return () => window.clearTimeout(timer);
    }, [isAdministrationRevealed]);

    usePublicPreviewReset({
        enabled: !useNativeTouchScroll,
        isAdministrationRevealed,
        setShowAdministrationScrollHint,
    });

    useNativeAdministrationScroll({
        enabled: useNativeTouchScroll,
        administrationSectionRef,
        setIsAdministrationRevealed,
        setShowAdministrationScrollHint,
    });

    useWheelAdministrationScroll({
        enabled: !useNativeTouchScroll,
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
    });

    return {
        administrationSectionRef,
        isAdministrationRevealed,
        showAdministrationScrollHint,
        showScannerReturnButton,
        returnToScanner,
    };
}
