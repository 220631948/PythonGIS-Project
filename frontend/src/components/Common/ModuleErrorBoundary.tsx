/**
 * ModuleErrorBoundary - Catches errors within individual modules
 * Displays a user-friendly error card instead of crashing the app
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    moduleName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ModuleErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ModuleErrorBoundary] Error caught:', error);
        console.error('[ModuleErrorBoundary] Error info:', errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 h-full flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-sm text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>

                            <h3 className="text-lg font-semibold text-red-800 mb-2">
                                Module Error
                            </h3>

                            <p className="text-sm text-red-600 mb-4">
                                Something went wrong in {this.props.moduleName || 'this module'}.
                            </p>

                            {this.state.error && (
                                <details className="mb-4 text-left">
                                    <summary className="text-xs text-red-500 cursor-pointer hover:underline">
                                        Technical Details
                                    </summary>
                                    <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700 overflow-auto max-h-24">
                                        {this.state.error.message}
                                    </pre>
                                </details>
                            )}

                            <button
                                onClick={this.handleRetry}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ModuleErrorBoundary;
