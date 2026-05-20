import { type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from 'react';

export interface WheelAdministrationScrollOptions {
    enabled: boolean;
    loginOpen: boolean;
    isAdministrationRevealed: boolean;
    showAdministrationScrollHint: boolean;
    administrationSectionRef: RefObject<HTMLElement | null>;
    isTransitioningRef: MutableRefObject<boolean>;
    scrollAmountRef: MutableRefObject<number>;
    scrollStepRef: MutableRefObject<number>;
    finishTransition: (delayMs?: number) => void;
    setIsAdministrationRevealed: Dispatch<SetStateAction<boolean>>;
    setShowAdministrationScrollHint: Dispatch<SetStateAction<boolean>>;
}
