/**
 * Login Component
 *
 * Sprint 3 - S3.1 (E.1.1): Enhanced with:
 * - Client-side validation (email format, password length)
 * - WCAG 2.1 AA compliance (E.3.1)
 * - Error handling and user feedback
 * - Keyboard navigation
 * - Screen reader support
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    // Refs for accessibility
    const emailInputRef = useRef<HTMLInputElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);

    // Focus email input on mount (accessibility)
    useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    // Announce errors to screen readers
    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.focus();
        }
    }, [error]);

    /**
     * Validate email format (RFC 5322 simplified)
     */
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    /**
     * Validate password (minimum 8 characters)
     */
    const validatePassword = (password: string): boolean => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        }
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    /**
     * Handle email blur (validate on blur)
     */
    const handleEmailBlur = () => {
        if (email) {
            validateEmail(email);
        }
    };

    /**
     * Handle password blur (validate on blur)
     */
    const handlePasswordBlur = () => {
        if (password) {
            validatePassword(password);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Client-side validation
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            setLoading(false);
            return;
        }

        try {
            await login(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8"
            role="main"
        >
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
                <div>
                    <h1 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
                        Sign in to GeoHub
                    </h1>
                    <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                        Enterprise GIS Platform
                    </p>
                </div>
                <form
                    className="mt-8 space-y-6"
                    onSubmit={handleSubmit}
                    aria-labelledby="login-heading"
                    noValidate
                >
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label
                                htmlFor="email-address"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Email address
                            </label>
                            <input
                                ref={emailInputRef}
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                aria-required="true"
                                aria-invalid={!!emailError}
                                aria-describedby={emailError ? "email-error" : undefined}
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    emailError
                                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                        : 'border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500'
                                } placeholder-slate-500 text-slate-900 dark:text-white dark:bg-slate-700 rounded-md focus:outline-none focus:z-10 sm:text-sm`}
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError(''); // Clear error on change
                                }}
                                onBlur={handleEmailBlur}
                            />
                            {emailError && (
                                <p
                                    id="email-error"
                                    className="mt-1 text-sm text-red-500"
                                    role="alert"
                                >
                                    {emailError}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    aria-required="true"
                                    aria-invalid={!!passwordError}
                                    aria-describedby={passwordError ? "password-error" : "password-hint"}
                                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                                        passwordError
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            : 'border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500'
                                    } placeholder-slate-500 text-slate-900 dark:text-white dark:bg-slate-700 rounded-md focus:outline-none focus:z-10 sm:text-sm`}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) setPasswordError(''); // Clear error on change
                                    }}
                                    onBlur={handlePasswordBlur}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    tabIndex={0}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {passwordError && (
                                <p
                                    id="password-error"
                                    className="mt-1 text-sm text-red-500"
                                    role="alert"
                                >
                                    {passwordError}
                                </p>
                            )}
                            {!passwordError && (
                                <p
                                    id="password-hint"
                                    className="mt-1 text-xs text-slate-500 dark:text-slate-400"
                                >
                                    Minimum 8 characters required
                                </p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div
                            ref={errorRef}
                            className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                            role="alert"
                            aria-live="assertive"
                            tabIndex={-1}
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !!emailError || !!passwordError}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-busy={loading}
                        >
                            {loading && (
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
