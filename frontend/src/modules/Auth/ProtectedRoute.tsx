/**
 * Protected Route Component
 *
 * Wraps routes that require authentication. Redirects to login if not authenticated.
 * Optionally checks for specific roles.
 *
 * Sprint 2 - Phase E.1.3
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && user) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.includes(user.role)
      : user.role === requiredRole;

    if (!hasRequiredRole) {
      // User is authenticated but doesn't have required role
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Access Denied
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
              Required role: {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}
              <br />
              Your role: {user.role}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required role (if any)
  return <>{children}</>;
};

/**
 * Role-specific route components for convenience
 */

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRole={['super_admin', 'tenant_admin']}>
      {children}
    </ProtectedRoute>
  );
};

export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="super_admin">
      {children}
    </ProtectedRoute>
  );
};

export const EditorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRole={['super_admin', 'tenant_admin', 'editor']}>
      {children}
    </ProtectedRoute>
  );
};
