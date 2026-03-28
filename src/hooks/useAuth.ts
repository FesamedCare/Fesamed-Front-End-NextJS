'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/api';

export type User = {
  user_id: string;
  name: string;
  lastname: string;
  email: string;
  role: string;
  [key: string]: unknown;
};

// Páginas que no requieren verificación de autenticación
export const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/',
  '/about',
  '/blog',
  '/contact',
  '/buscar-doctor',
];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Stable function: does not depend on pathname.
  // apiClient already handles token refresh + redirect to /login on expiry.
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getCurrentUser() as User;
      setUser(userData);
    } catch {
      setUser(null);
      // apiClient handles the /login redirect when the session truly expires.
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError('Error al cerrar sesión');
    }
  }, [router]);

  // Initial fetch on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Re-fetch when another tab triggers a login or logout
  useEffect(() => {
    const handleStorageChange = () => {
      fetchUser();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    refreshUser: fetchUser,
    logout: handleLogout,
  };
}
