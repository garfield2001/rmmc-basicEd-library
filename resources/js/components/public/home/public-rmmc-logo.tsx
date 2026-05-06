import { RMMC_LOGO_PATH } from './constants';

interface PublicRMMCLogoProps {
    className?: string;
    imageClassName?: string;
}

export function PublicRMMCLogo({
    className = 'flex shrink-0 items-center justify-center',
    imageClassName = 'h-20 w-auto sm:h-24',
}: PublicRMMCLogoProps) {
    return (
        <div className={className}>
            <img src={RMMC_LOGO_PATH} alt="RMMC logo" className={imageClassName} />
        </div>
    );
}
