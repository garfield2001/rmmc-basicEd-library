import { RMMC_LOGO_PATH } from './admin-layout.constants';

interface AdminLogoMarkProps {
    className?: string;
}

export function AdminLogoMark({ className = 'size-11' }: AdminLogoMarkProps) {
    return <img src={RMMC_LOGO_PATH} alt="RMMC logo" className={`${className} shrink-0 object-contain`} />;
}
