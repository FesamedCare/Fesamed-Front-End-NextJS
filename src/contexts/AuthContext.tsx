'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, User } from '@/hooks/useAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  /** Se incrementa en cada cambio de perfil. Úsalo como dependencia de useEffect. */
  profileVersion: number;
  /** Llamar tras modificar el perfil: recarga el usuario y avisa a los suscriptores. */
  notifyProfileChanged: () => Promise<void>;
}

// Valor por defecto para cuando no se ha inicializado el contexto
const defaultAuthContext: AuthContextType = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  refreshUser: async () => {},
  logout: async () => {},
  profileVersion: 0,
  notifyProfileChanged: async () => {}
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  return context;
} 