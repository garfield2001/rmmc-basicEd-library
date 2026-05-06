import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogIn, ShieldCheck } from 'lucide-react';
import type { FormEventHandler } from 'react';
import type { LoginForm } from './types';

interface AdminLoginDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: LoginForm;
    errors: {
        email?: string;
        password?: string;
    };
    processing: boolean;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: FormEventHandler;
}

export function AdminLoginDialog({ open, onOpenChange, data, errors, processing, onEmailChange, onPasswordChange, onSubmit }: AdminLoginDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden border-[#040DBF]/20 p-0 shadow-2xl shadow-[#010440]/25 sm:max-w-md">
                <div className="h-2 bg-[linear-gradient(90deg,#040DBF_0%,#030A8C_52%,#010440_100%)]" />
                <div className="p-6">
                    <DialogHeader>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-lg bg-[#040DBF] text-white shadow-lg shadow-[#040DBF]/25">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl text-[#010440]">Admin login</DialogTitle>
                                <DialogDescription className="mt-1 text-sm leading-5 text-[#030A8C]">
                                    Staff access for records and library tools.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={onSubmit} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="admin-email" className="text-sm font-medium text-[#010440]">
                                Email
                            </label>
                            <input
                                id="admin-email"
                                type="email"
                                value={data.email}
                                onChange={(event) => onEmailChange(event.target.value)}
                                className="mt-2 h-11 w-full rounded-lg border border-[#030A8C]/20 bg-[#f6f8ff] px-3 text-sm text-[#010440] transition outline-none focus:border-[#040DBF] focus:bg-white focus:ring-4 focus:ring-[#040DBF]/10"
                                autoComplete="email"
                            />
                            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="text-sm font-medium text-[#010440]">
                                Password
                            </label>
                            <input
                                id="admin-password"
                                type="password"
                                value={data.password}
                                onChange={(event) => onPasswordChange(event.target.value)}
                                className="mt-2 h-11 w-full rounded-lg border border-[#030A8C]/20 bg-[#f6f8ff] px-3 text-sm text-[#010440] transition outline-none focus:border-[#040DBF] focus:bg-white focus:ring-4 focus:ring-[#040DBF]/10"
                                autoComplete="current-password"
                            />
                            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-[#030A8C]/20 text-[#020659] hover:bg-[#f6f8ff]"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-[#040DBF] text-white shadow-sm hover:bg-[#030A8C]">
                                <LogIn className="size-4" />
                                {processing ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
