/**
 * Cliente API personalizado con manejo automático de refresh token
 */

import { PUBLIC_PATHS } from '@/hooks/useAuth';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  noCredentials?: boolean;
};

// Control para evitar múltiples solicitudes de refresh simultáneas
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Cola de solicitudes en espera
const waitingRequests: Array<() => void> = [];

/**
 * Ejecuta solicitudes a la API con manejo automático de tokens
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;

  // Configuración predeterminada
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: options.noCredentials ? 'omit' : 'include',
  };

  // Añadir body si existe
  if (options.body) {
    fetchOptions.body =
      options.headers?.['Content-Type'] === 'application/x-www-form-urlencoded'
        ? options.body as URLSearchParams
        : JSON.stringify(options.body);
  }

  try {
    // Realizar la solicitud inicial
    const response = await fetch(url, fetchOptions);

    // Si es exitosa, retornar respuesta
    if (response.ok) {
      // Para respuestas vacías (204 No Content)
      if (response.status === 204) return {} as T;
      return await response.json();
    }

    // Si el token ha expirado (401), intentar renovarlo
    if (response.status === 401) {
      // Intentar renovar el token
      const refreshResult = await refreshToken();

      // Si se renovó con éxito, reintentar la solicitud original
      if (refreshResult) {
        return apiClient<T>(endpoint, options);
      }

      // Si la renovación falló, lanzar error
      throw new Error('Session expired');
    }

    // Otros errores
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
  } catch (error) {
    if ((error as Error).message === 'Session expired') {
      // Evitar bucle de redirecciones si ya estamos en una página pública
      const currentPath = window.location.pathname;
      const isPublicPage = PUBLIC_PATHS.some((path: string) =>
        path === '/' ? currentPath === '/' : currentPath.includes(path)
      );

      if (!isPublicPage) {
        window.location.href = '/login';
      }
    }
    throw error;
  }
}

/**
 * Intenta renovar el token de acceso
 */
async function refreshToken(): Promise<boolean> {
  // Si ya está en proceso de refreshing, esperar a que termine
  if (isRefreshing) {
    return refreshPromise as Promise<boolean>;
  }

  // Iniciar proceso de refresh
  isRefreshing = true;
  refreshPromise = new Promise<boolean>(async (resolve) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      // Si el refresh es exitoso
      if (response.ok) {
        // Resolver todas las solicitudes en espera
        waitingRequests.forEach(callback => callback());
        waitingRequests.length = 0;
        resolve(true);
      } else {
        // Si falla el refresh, rechazar todas las solicitudes
        resolve(false);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      resolve(false);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });

  return refreshPromise;
}

/**
 * Shorthand para solicitudes GET
 */
export function get<T = unknown>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Shorthand para solicitudes POST
 */
export function post<T = unknown>(endpoint: string, data?: unknown, options?: Omit<ApiOptions, 'method'>) {
  return apiClient<T>(endpoint, { ...options, method: 'POST', body: data });
}

/**
 * Shorthand para solicitudes PUT
 */
export function put<T = unknown>(endpoint: string, data?: unknown, options?: Omit<ApiOptions, 'method'>) {
  return apiClient<T>(endpoint, { ...options, method: 'PUT', body: data });
}

/**
 * Shorthand para solicitudes PATCH
 */
export function patch<T = unknown>(endpoint: string, data?: unknown, options?: Omit<ApiOptions, 'method'>) {
  return apiClient<T>(endpoint, { ...options, method: 'PATCH', body: data });
}

/**
 * Shorthand para solicitudes DELETE
 */
export function del<T = unknown>(endpoint: string, options?: Omit<ApiOptions, 'method'>) {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Función para iniciar sesión
 */
export async function login(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const result = await apiClient('/api/v1/login', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  // Notificar cambio de autenticación
  try {
    localStorage.setItem('auth_event', Date.now().toString());
  } catch {
    console.warn('No se pudo actualizar el localStorage');
  }

  return result;
}

/**
 * Función para cerrar sesión
 */
export async function logout() {
  const result = await apiClient('/api/v1/logout', { method: 'POST' });

  // Notificar cambio de autenticación
  try {
    localStorage.setItem('auth_event', Date.now().toString());
  } catch {
    console.warn('No se pudo actualizar el localStorage');
  }

  return result;
}

/**
 * Función para obtener información del usuario actual
 */
export async function getCurrentUser() {
  return apiClient('/api/v1/user/me/');
}

/**
 * Función para obtener los roles disponibles
 */
export async function getRoles() {
  return apiClient('/api/v1/roles/');
} 