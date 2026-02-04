import React, { Suspense } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import { SkeletonList, SkeletonCard } from './SkeletonLoading';

interface LoadingBoundaryProps {
    children: React.ReactNode;
    loading?: boolean;
    error?: Error | string | null;
    onRetry?: () => void;
    fallback?: React.ReactNode;
    skeletonType?: 'list' | 'card' | 'map' | 'table';
    variant?: 'full' | 'compact';
}

/**
 * LoadingBoundary
 * 
 * A wrapper component that handles:
 * 1. Suspense for code splitting (lazy loading)
 * 2. Error Boundary for runtime crashes
 * 3. Loading state visualization with Skeletons
 * 4. Error state visualization with Retry button
 */
const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
    children,
    loading = false,
    error = null,
    onRetry,
    fallback,
    skeletonType = 'card',
    variant = 'full'
}) => {
    // 1. Explicit Loading State
    if (loading) {
        if (fallback) return <>{fallback}</>;

        switch (skeletonType) {
            case 'list': return <SkeletonList count={3} />;
            case 'table': return <SkeletonList count={5} />; // Re-use list for now or add SkeletonTable
            case 'card':
            default: return <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SkeletonCard /><SkeletonCard /></div>;
        }
    }

    // 2. Explicit Error State
    if (error) {
        const errorMessage = typeof error === 'string' ? error : error.message;

        return (
            <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-center flex flex-col items-center justify-center h-full min-h-[200px]">
                <div className="bg-red-100 p-3 rounded-full mb-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Unable to load content</h3>
                <p className="text-sm text-red-700 max-w-xs mb-4">{errorMessage}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                )}
            </div>
        );
    }

    // 3. React Suspense & Error Boundary Wrapper
    return (
        <ErrorBoundary variant={variant}>
            <Suspense fallback={fallback || <SkeletonList count={3} />}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
};

export default LoadingBoundary;
