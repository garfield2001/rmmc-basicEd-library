import { rmmcLogoPath } from './constants';

interface RmmcLogoMarkProps {
    className?: string;
}

export function RmmcLogoMark({ className = 'size-11' }: RmmcLogoMarkProps) {
    return (
        <span
            className={`flex ${className} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm`}
        >
            <img src={rmmcLogoPath} alt="RMMC logo" className="size-full object-contain p-1" />
        </span>
    );
}
