import { Component, ErrorInfo, ReactNode } from 'react';
import { isOffscreenCanvasSupported, isStructuredCloneSupported } from '../utils/browserSupport';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    public checkBrowserSupport(): { supported: boolean; reason?: string } {
        if (!isOffscreenCanvasSupported()) {
            return {
                supported: false,
                reason: 'Your browser does not support OffscreenCanvas, which is required for smooth plant rendering.'
            };
        }

        if (!isStructuredCloneSupported()) {
            return {
                supported: false,
                reason: 'Your browser does not support required features for data transfer.'
            };
        }

        if (!('indexedDB' in window)) {
            return {
                supported: false,
                reason: 'Your browser does not support IndexedDB, which is required for storing garden data.'
            };
        }

        return { supported: true };
    }

    private renderError() {
        const support = this.checkBrowserSupport();
        if (!support.supported) {
            return (
                <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                    <h1 className="text-2xl font-bold mb-4">Browser Not Supported</h1>
                    <p className="text-center mb-6">{support.reason}</p>
                    <p className="text-sm opacity-75">
                        Please try using a modern browser like Chrome, Edge, or Firefox.
                    </p>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h1>
                <p className="text-center mb-6">
                    {this.state.error?.message || 'An unexpected error occurred.'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                    Reload App
                </button>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <pre className="mt-4 p-4 bg-gray-800 rounded overflow-auto max-w-full text-xs">
                        {this.state.errorInfo.componentStack}
                    </pre>
                )}
            </div>
        );
    }

    public render() {
        if (this.state.hasError) {
            return this.renderError();
        }

        return this.props.children;
    }
}
