'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  '/buscar-doctor'
];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    // Para debugging
    console.log("fetchUser llamado, pathname:", pathname);
    
    // No verificar autenticación en páginas públicas
    if (PUBLIC_PATHS.some(path => pathname?.includes(path))) {
      // Pero igual intentamos obtener el usuario si hay cookies
      try {
        const userData = await getCurrentUser() as User;
        console.log("Usuario encontrado en página pública:", userData);
        setUser(userData);
      } catch {
        // Silenciosamente fallar en páginas públicas
        setUser(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userData = await getCurrentUser() as User;
      console.log("Usuario obtenido:", userData);
      setUser(userData);
    } catch (err) {
      console.error("Error obteniendo usuario:", err);
      setUser(null);
      // No mostrar error en páginas públicas
      if (!PUBLIC_PATHS.some(path => pathname?.includes(path))) {
        setError('No se pudo obtener la información del usuario');
        console.error('Error fetching user:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [pathname]);

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

  // Llamada inicial para obtener el usuario
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Escuchar cambios en el almacenamiento para detectar login/logout en otras pestañas
  useEffect(() => {
    const handleStorageChange = () => {
      console.log("Cambio detectado en almacenamiento, refrescando usuario");
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
    logout: handleLogout
  };
} 
