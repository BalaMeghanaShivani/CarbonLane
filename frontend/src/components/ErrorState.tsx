import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

const ErrorState = ({ message = 'Something went wrong', onRetry }: ErrorStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold text-white">Error</h3>
            <p className="mb-6 text-gray-400">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600"
                >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                </button>
            )}
        </div>
    );
};

export default ErrorState;
