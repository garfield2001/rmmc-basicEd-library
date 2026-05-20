import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SharedData } from '@/types/shared';
import { usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SessionReplacedEvent {
    sessionId?: string;
}

export function ForcedLogoutListener() {
    const { auth } = usePage<SharedData>().props;

    if (!auth.user) {
        return null;
    }

    return <ForcedLogoutChannel userId={auth.user.id} sessionId={auth.user.sessionId ?? ''} />;
}

function ForcedLogoutChannel({ userId, sessionId }: { userId: number; sessionId: string }) {
    const [isForcedLogout, setIsForcedLogout] = useState(false);

    useEcho<SessionReplacedEvent>(
        `App.Models.User.${userId}`,
        '.UserSessionReplaced',
        (event) => {
            if (!event.sessionId || event.sessionId === sessionId) {
                return;
            }

            setIsForcedLogout(true);
        },
        [sessionId],
    );

    useEffect(() => {
        if (!sessionId || isForcedLogout) {
            return;
        }

        const controller = new AbortController();

        const checkSession = async () => {
            try {
                const response = await fetch('/session/status', {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controller.signal,
                });

                if (response.status === 401 || response.status === 419 || response.redirected) {
                    setIsForcedLogout(true);
                    return;
                }

                if (!response.ok) {
                    return;
                }

                const status = (await response.json()) as { authenticated?: boolean; sessionId?: string };

                if (!status.authenticated || (status.sessionId && status.sessionId !== sessionId)) {
                    setIsForcedLogout(true);
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    return;
                }
            }
        };

        const timer = window.setInterval(checkSession, 15000);
        void checkSession();

        return () => {
            controller.abort();
            window.clearInterval(timer);
        };
    }, [isForcedLogout, sessionId]);

    return (
        <Dialog open={isForcedLogout}>
            <DialogContent hideClose className="max-w-md">
                <DialogHeader>
                    <span className="mb-2 inline-flex size-11 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                        <LogOut className="size-5" />
                    </span>
                    <DialogTitle>Your admin session moved to another device</DialogTitle>
                    <DialogDescription>
                        This account was signed in somewhere else, so this device was logged out to keep only one active admin session.
                    </DialogDescription>
                </DialogHeader>
                <Button type="button" className="mt-2 w-full" onClick={() => window.location.assign('/')}>
                    Return to login
                </Button>
            </DialogContent>
        </Dialog>
    );
}
