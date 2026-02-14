import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-slate-900 p-8">
                        <h2 className="text-lg font-medium text-white">Something went wrong</h2>
                        <p className="text-sm text-slate-400">{this.state.error?.message ?? 'Unknown error'}</p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                        >
                            Try again
                        </button>
                    </div>
                )
            );
        }
        return this.props.children;
    }
}
