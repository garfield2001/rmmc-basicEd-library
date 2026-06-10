import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface DashboardErrorBoundaryProps {
    children: ReactNode;
}

interface DashboardErrorBoundaryState {
    error: Error | null;
}

export class DashboardErrorBoundary extends Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
    state: DashboardErrorBoundaryState = {
        error: null,
    };

    static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Dashboard render failed.', error, info);
    }

    render() {
        if (!this.state.error) {
            return this.props.children;
        }

        return (
            <section className="admin-surface mx-auto mt-8 max-w-2xl rounded-lg border border-red-200 bg-white/95 p-6 text-[#010440] shadow-sm">
                <span className="admin-icon-badge mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-red-50 text-red-700">
                    <AlertTriangle className="size-5" />
                </span>
                <h1 className="text-xl font-semibold tracking-normal">Dashboard could not finish loading</h1>
                <p className="mt-2 text-sm leading-6 text-[#020659]/70">
                    One dashboard panel failed to render. Refresh the page after rebuilding assets, or open another admin page while this is fixed.
                </p>
                <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-800">
                    {this.state.error.message}
                </pre>
            </section>
        );
    }
}
