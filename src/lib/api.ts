/**
 * Cliente API personalizado con manejo automático de refresh token
 */

import { PUBLIC_PATHS } from '@/hooks/useAuth';
import { AuthExpiredError, parseErrorDetail, shouldAttemptRefresh } from './apiError';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  noCredentials?: boolean;
  /** Uso interno: evita que un 401 persistente encadene reintentos sin fin. */
  _retried?: boolean;
};

// Control to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

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

    // Un 401 puede significar dos cosas distintas y hay que separarlas:
    //   - el access token venció        -> renovar y reintentar
    //   - el endpoint rechazó los datos -> mostrar el mensaje del backend
    // Tratarlas igual hacía que un login con contraseña mala mostrara
    // "Session expired" en vez de "Email o contraseña no válidos".
    if (response.status === 401 && shouldAttemptRefresh(endpoint)) {
      // Si ya reintentamos con un token nuevo y sigue en 401, la sesión no sirve.
      // Sin este corte, un 401 persistente encadenaba refresh y reintento sin fin.
      if (options._retried) {
        throw new AuthExpiredError();
      }

      const refreshResult = await refreshToken();

      // Si se renovó con éxito, reintentar la solicitud original una sola vez.
      if (refreshResult) {
        return apiClient<T>(endpoint, { ...options, _retried: true });
      }

      // El refresh también falló: la sesión ya no es recuperable.
      throw new AuthExpiredError();
    }

    // Cualquier otro error, incluido el 401 de credenciales inválidas.
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseErrorDetail(errorData, response.status, response.statusText));
  } catch (error) {
    if (error instanceof AuthExpiredError && typeof window !== 'undefined') {
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