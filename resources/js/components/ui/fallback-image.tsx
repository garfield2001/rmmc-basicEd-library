import { useEffect, useState, type ReactNode } from 'react';

interface FallbackImageProps {
    src?: string | null;
    alt?: string;
    className?: string;
    fallback: ReactNode;
}

export function FallbackImage({ src, alt = '', className, fallback }: FallbackImageProps) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [src]);

    if (!src || imageFailed) {
        return fallback;
    }

    return <img src={src} alt={alt} className={className} onError={() => setImageFailed(true)} />;
}
