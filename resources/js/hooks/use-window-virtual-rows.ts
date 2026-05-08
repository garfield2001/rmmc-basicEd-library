import { useCallback, useEffect, useState, type RefObject } from 'react';

interface WindowVirtualRowsOptions {
    enabled: boolean;
    itemCount: number;
    rowHeight: number;
    overscan: number;
    containerRef: RefObject<HTMLElement | null>;
}

export function useViewportHeight() {
    const [height, setHeight] = useState(() => (typeof window === 'undefined' ? 900 : window.innerHeight));

    useEffect(() => {
        const updateHeight = () => setHeight(window.innerHeight);

        window.addEventListener('resize', updateHeight);

        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    return height;
}

export function useWindowVirtualRows({ enabled, itemCount, rowHeight, overscan, containerRef }: WindowVirtualRowsOptions) {
    const [range, setRange] = useState({
        startIndex: 0,
        endIndex: itemCount,
        paddingTop: 0,
        paddingBottom: 0,
    });

    const updateRange = useCallback(() => {
        if (!enabled || !containerRef.current) {
            setRange({
                startIndex: 0,
                endIndex: itemCount,
                paddingTop: 0,
                paddingBottom: 0,
            });

            return;
        }

        const tableBodyTop = containerRef.current.getBoundingClientRect().top;
        const totalHeight = itemCount * rowHeight;
        const visibleTop = Math.max(0, -tableBodyTop);
        const visibleBottom = Math.min(totalHeight, window.innerHeight - tableBodyTop);
        const startIndex = Math.max(0, Math.floor(visibleTop / rowHeight) - overscan);
        const endIndex = Math.min(itemCount, Math.ceil(visibleBottom / rowHeight) + overscan);

        setRange({
            startIndex,
            endIndex: Math.max(startIndex + 1, endIndex),
            paddingTop: startIndex * rowHeight,
            paddingBottom: Math.max(0, (itemCount - endIndex) * rowHeight),
        });
    }, [containerRef, enabled, itemCount, overscan, rowHeight]);

    useEffect(() => {
        updateRange();

        if (!enabled) {
            return;
        }

        window.addEventListener('scroll', updateRange, { passive: true });
        window.addEventListener('resize', updateRange);

        return () => {
            window.removeEventListener('scroll', updateRange);
            window.removeEventListener('resize', updateRange);
        };
    }, [enabled, updateRange]);

    return range;
}
