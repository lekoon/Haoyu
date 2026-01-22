import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: any[];
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCount: number;
    copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    private resetTimeout?: number;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0,
            copied: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Update state
        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1,
        }));

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Send error to monitoring service (in production)
        if (import.meta.env.PROD) {
            this.logErrorToService(error, errorInfo);
        }
    }

    componentDidUpdate(prevProps: Props) {
        // Reset error boundary when resetKeys change
        if (this.props.resetKeys && prevProps.resetKeys) {
            const hasResetKeyChanged = this.props.resetKeys.some(
                (key, index) => key !== prevProps.resetKeys?.[index]
            );

            if (hasResetKeyChanged && this.state.hasError) {
                this.handleReset();
            }
        }
    }

    componentWillUnmount() {
        if (this.resetTimeout) {
            clearTimeout(this.resetTimeout);
        }
    }

    logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
        // In production, send to error monitoring service
        // Example: Sentry, LogRocket, etc.
        try {
            const errorData = {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
            };

            // TODO: Replace with actual error reporting service
            console.log('Error logged to service:', errorData);
        } catch (loggingError) {
            console.error('Failed to log error:', loggingError);
        }
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleReload = () => {
        window.location.reload();
    };

    handleCopyError = () => {
        if (!this.state.error) return;

        const errorText = `
Error: ${this.state.error.message}

Stack Trace:
${this.state.error.stack}

Component Stack:
${this.state.errorInfo?.componentStack || 'N/A'}

URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
        `.trim();

        navigator.clipboard.writeText(errorText).then(() => {
            this.setState({ copied: true });
            this.resetTimeout = setTimeout(() => {
                this.setState({ copied: false });
            }, 2000);
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Show different UI based on error count
            const isCritical = this.state.errorCount > 2;

            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-4 rounded-full ${isCritical ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                                {isCritical ? (
                                    <Bug className="w-8 h-8 text-red-600 dark:text-red-400" />
                                ) : (
                                    <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                    {isCritical ? 'Critical Error' : 'Oops! Something went wrong'}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400 mt-1">
                                    {isCritical
                                        ? 'Multiple errors detected. Please reload the page.'
                                        : "We're sorry for the inconvenience"}
                                </p>
                            </div>
                        </div>

                        {/* Error Details */}
                        {this.state.error && (
                            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm font-mono text-red-600 dark:text-red-400 flex-1">
                                        {this.state.error.toString()}
                                    </p>
                                    <button
                                        onClick={this.handleCopyError}
                                        className="ml-2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                        title="Copy error details"
                                    >
                                        {this.state.copied ? (
                                            <Check size={16} className="text-green-500" />
                                        ) : (
                                            <Copy size={16} className="text-slate-400" />
                                        )}
                                    </button>
                                </div>

                                {/* Stack trace (dev only) */}
                                {import.meta.env.DEV && this.state.errorInfo && (
                                    <details className="mt-3">
                                        <summary className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200">
                                            View stack trace
                                        </summary>
                                        <pre className="mt-2 text-xs text-slate-600 dark:text-slate-400 overflow-auto max-h-64 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            {!isCritical && (
                                <button
                                    onClick={this.handleReset}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    <RefreshCw size={18} />
                                    Try Again
                                </button>
                            )}
                            <button
                                onClick={this.handleReload}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-green-600/20"
                            >
                                <RefreshCw size={18} />
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-xl transition-colors"
                            >
                                <Home size={18} />
                                Go Home
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>Tip:</strong> If this problem persists:
                            </p>
                            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                                <li>Try clearing your browser cache</li>
                                <li>Check your internet connection</li>
                                <li>Copy the error details and contact support</li>
                                {import.meta.env.DEV && <li>Check the browser console for more details</li>}
                            </ul>
                        </div>

                        {/* Error Count Warning */}
                        {this.state.errorCount > 1 && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    ⚠️ This error has occurred {this.state.errorCount} times. Consider reloading the page.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

// Utility function to wrap components with error boundary
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
): React.ComponentType<P> {
    return (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );
}
