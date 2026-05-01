import { rmmcLogoPath } from './constants';

interface PublicRmmcLogoProps {
    className?: string;
    imageClassName?: string;
}

export function PublicRmmcLogo({
    className = 'flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg',
    imageClassName = 'size-full object-contain p-2',
}: PublicRmmcLogoProps) {
    return (
        <span className={className}>
            <img src={rmmcLogoPath} alt="RMMC logo" className={imageClassName} />
        </span>
    );
}
