import type { SharedData } from '@/types/shared';
import { usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SchoolYearDetailsDialog } from './school-year-navbar/details-dialog';
import { SchoolYearPreviewOverlay } from './school-year-navbar/preview-overlay';

export function SchoolYearNavbarControl() {
    const { schoolYear, schoolYears } = usePage<SharedData>().props;
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [canPortal, setCanPortal] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, right: 0 });
    const triggerRef = useRef<HTMLDivElement | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setCanPortal(true);
    }, []);

    useEffect(() => {
        if (!schoolYear) {
            setPreviewOpen(false);
            setDetailsOpen(true);
        }
    }, [schoolYear]);

    useEffect(() => {
        if (!previewOpen) {
            return;
        }

        const updatePosition = () => {
            const rect = triggerRef.current?.getBoundingClientRect();

            if (rect) {
                setPreviewPosition({ top: rect.bottom + 8, right: Math.max(16, window.innerWidth - rect.right) });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [previewOpen]);

    useEffect(() => {
        if (!previewOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node;

            if (!triggerRef.current?.contains(target) && !previewRef.current?.contains(target)) {
                setPreviewOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setPreviewOpen(false);

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [previewOpen]);

    return (
        <>
            {canPortal &&
                previewOpen &&
                !detailsOpen &&
                createPortal(
                    <SchoolYearPreviewOverlay
                        position={previewPosition}
                        previewRef={previewRef}
                        schoolYear={schoolYear}
                        onDetailsOpen={() => {
                            setPreviewOpen(false);
                            setDetailsOpen(true);
                        }}
                    />,
                    document.body,
                )}

            <div ref={triggerRef} className="group relative z-[60]">
                <button
                    type="button"
                    aria-expanded={previewOpen}
                    aria-haspopup="dialog"
                    onClick={() => setPreviewOpen((open) => !open)}
                    className="admin-school-year-badge inline-flex h-9 items-center overflow-hidden rounded-full border border-[#040DBF]/10 bg-white text-xs shadow-sm transition hover:border-[#040DBF]/25 hover:shadow-md hover:shadow-[#040DBF]/10"
                >
                    <span className="admin-school-year-label border-r border-[#040DBF]/10 bg-[#f6f8ff] px-3 font-medium text-[#030A8C]">
                        School year
                    </span>
                    <span className="admin-school-year-value inline-flex items-center gap-2 px-3 font-semibold text-[#010440]">
                        {schoolYear?.name ?? 'Not configured'}
                        <ChevronDown className={`size-3.5 transition-transform ${previewOpen ? 'rotate-180' : ''}`} />
                    </span>
                </button>
            </div>

            <SchoolYearDetailsDialog
                open={detailsOpen}
                schoolYears={schoolYears}
                onOpenChange={setDetailsOpen}
                requireActiveSchoolYear={!schoolYear}
            />
        </>
    );
}
