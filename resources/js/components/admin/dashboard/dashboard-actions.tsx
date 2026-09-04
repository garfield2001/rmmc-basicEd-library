import { RequiredProgressPanel } from '@/components/admin/dashboard/required-progress-panel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { IndividualProgressPoint, RequiredProgressPoint } from '@/types/dashboard';
import { Link } from '@inertiajs/react';
import { RadioTower, Trophy } from 'lucide-react';
import { useState } from 'react';

interface DashboardActionsProps {
    requiredProgress: RequiredProgressPoint[];
    individualProgress?: IndividualProgressPoint[];
}

export function DashboardActions({ requiredProgress, individualProgress = [] }: DashboardActionsProps) {
    const [progressOpen, setProgressOpen] = useState(false);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-4 text-sm font-medium text-[#020659] shadow-sm transition hover:border-[#040DBF]/30 hover:bg-[#f6f8ff]"
                    >
                        <Trophy className="size-4" />
                        Required progress
                    </button>
                </DialogTrigger>
                <DialogContent className="max-h-[calc(100vh-3rem)] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Required Visit Progress</DialogTitle>
                    </DialogHeader>
                    <RequiredProgressPanel progress={requiredProgress} individualProgress={individualProgress} framed={false} />
                </DialogContent>
            </Dialog>
            <Link
                href="/admin/live-visits"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#040DBF] px-4 text-sm font-medium text-white shadow-sm shadow-[#040DBF]/20 hover:bg-[#030A8C]"
            >
                <RadioTower className="size-4" />
                Open live visits
            </Link>
        </div>
    );
}
