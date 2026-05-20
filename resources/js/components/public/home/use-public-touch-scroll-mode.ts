import { useEffect, useState } from 'react';

export function usePublicTouchScrollMode() {
    const [useNativeTouchScroll, setUseNativeTouchScroll] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(pointer: coarse)');
        const syncNativeScrollPreference = () => setUseNativeTouchScroll(media.matches);

        syncNativeScrollPreference();
        media.addEventListener('change', syncNativeScrollPreference);

        return () => media.removeEventListener('change', syncNativeScrollPreference);
    }, []);

    return useNativeTouchScroll;
}
