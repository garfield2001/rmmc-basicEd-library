import { useEffect, useState } from 'react';
import { formatManilaDateTime } from './helpers';

export function useManilaClock() {
    const [manilaTime, setManilaTime] = useState(() => new Date());

    useEffect(() => {
        const interval = window.setInterval(() => {
            setManilaTime(new Date());
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    return {
        manilaTime,
        formattedManilaTime: formatManilaDateTime(manilaTime),
    };
}
