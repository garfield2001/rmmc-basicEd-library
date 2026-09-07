import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogIn } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { RMMC_LOGO_PATH } from './constants';
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
            <DialogContent className="overflow-hidden border-white/20 bg-white/80 p-0 shadow-2xl backdrop-blur-md sm:max-w-md">
                <div className="h-2 bg-[linear-gradient(90deg,#040DBF_0%,#030A8C_52%,#010440_100%)]" />
                <div className="p-6">
                    <DialogHeader>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white p-1 shadow-sm">
                                <img src={RMMC_LOGO_PATH} alt="RMMC logo" className="size-full object-contain" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl tracking-tight text-slate-900">Admin login</DialogTitle>
                                <DialogDescription className="mt-1 text-sm leading-5 font-normal text-slate-500">
                                    Staff access for records and library tools.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={onSubmit} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="admin-email" className="text-sm font-medium text-slate-900">
                                Email
                            </label>
                            <input
                                id="admin-email"
                                type="email"
                                value={data.email}
                                onChange={(event) => onEmailChange(event.target.value)}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 transition-all duration-200 outline-none focus:border-blue-500 focus:bg-white focus:shadow-md focus:ring-4 focus:shadow-blue-500/5 focus:ring-blue-500/10"
                                autoComplete="email"
                            />
                            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="text-sm font-medium text-slate-900">
                                Password
                            </label>
                            <input
                                id="admin-password"
                                type="password"
                                value={data.password}
                                onChange={(event) => onPasswordChange(event.target.value)}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 transition-all duration-200 outline-none focus:border-blue-500 focus:bg-white focus:shadow-md focus:ring-4 focus:shadow-blue-500/5 focus:ring-blue-500/10"
                                autoComplete="current-password"
                            />
                            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-95"
                            >
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
