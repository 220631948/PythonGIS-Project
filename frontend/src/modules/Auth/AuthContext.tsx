/**
 * Authentication Context Provider
 *
 * Manages global authentication state using TanStack Query including:
 * - JWT token storage and refresh
 * - User profile data
 * - Login/logout operations
 * - Automatic token refresh (Silent Refresh)
 * - CSRF token management
 *
 * Sprint 3 - Phase E.1.2 - E.1.4
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  id: number;
  email: string;
  tenant_id: number;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Decode JWT token to extract user information
 */
const decodeToken = (token: string): Partial<User> | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);

    return {
      id: payload.user_id,
      email: payload.sub,
      tenant_id: payload.tenant_id,
      role: payload.role,
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Get CSRF token from cookie
 */
const getCsrfToken = (): string | null => {
  const name = 'csrf_token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refresh_token'));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query for current user session
  const { data: user, isLoading: isUserLoading, refetch: refetchUser } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      if (!token) return null;
      const userInfo = decodeToken(token);
      if (!userInfo) return null;
      return {
        id: userInfo.id!,
        email: userInfo.email!,
        tenant_id: userInfo.tenant_id!,
        role: userInfo.role!,
        is_active: true,
      } as User;
    },
    enabled: !!token,
    staleTime: Infinity,
  });

  /**
   * Refresh access token mutation
   */
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const storedRefreshToken = localStorage.getItem('refresh_token');
      if (!storedRefreshToken) throw new Error('No refresh token');

      const csrfToken = getCsrfToken();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers,
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (!response.ok) throw new Error('Token refresh failed');
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
    onError: () => {
      logoutMutation.mutate();
    },
  });

  /**
   * Login mutation
   */
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: any) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password: password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      navigate('/');
    },
  });

  /**
   * Logout mutation
   */
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const csrfToken = getCsrfToken();
        const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
        await fetch('/api/auth/logout', { method: 'POST', headers });
      } catch (e) {
        console.error('Logout error:', e);
      }
    },
    onSettled: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setRefreshToken(null);
      queryClient.setQueryData(['auth', 'user'], null);
      navigate('/login');
    },
  });

  /**
   * Setup automatic token refresh (Silent Refresh)
   * Access tokens expire in 15 minutes, refresh at 10 minutes
   */
  useEffect(() => {
    if (!token || !refreshToken) return;

    const refreshInterval = setInterval(() => {
      refreshMutation.mutate();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [token, refreshToken, refreshMutation]);

  const value: AuthContextType = {
    user: user || null,
    token,
    refreshToken,
    isAuthenticated: !!token && !!user,
    isLoading: isUserLoading,
    login: async (email, password) => {
      await loginMutation.mutateAsync({ email, password });
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    refreshAccessToken: async () => {
      await refreshMutation.mutateAsync();
    },
    checkAuth: async () => {
      await refetchUser();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useRequireAuth = (): User => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    throw new Error('User must be authenticated');
  }
  return user;
};
