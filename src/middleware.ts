import { NextRequest, NextResponse } from "next/server";

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard", "/dashboard/edit-profile", "/agendar-cita"];

// Rutas que solo deben ser accesibles para usuarios no autenticados
const authRoutes = ["/login", "/register"];

// Rutas con restricciones basadas en roles
const roleRestrictedRoutes: Record<string, string[]> = {
  patient: ["/dashboard/edit-doctor-profile"],
  doctor: ["/dashboard/edit-patient-profile"]
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getSetCookieHeaders(response: Response): string[] {
  const out: string[] = [];
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === "function") {
    out.push(...getSetCookie());
  } else {
    const v = response.headers.get("set-cookie");
    if (v) out.push(v);
  }
  return out;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieHeader = req.headers.get("cookie") || "";

  if (!API_URL) {
    return NextResponse.next();
  }

  async function isAuthenticated(): Promise<{ user: Record<string, unknown> | null; newCookieHeaders: string[] }> {
    const newCookieHeaders: string[] = [];
    try {
      const response = await fetch(`${API_URL}/api/v1/user/me/`, {
        method: "GET",
        headers: { Cookie: cookieHeader },
      });

      if (response.status === 401 && cookieHeader) {
        const refreshRes = await fetch(`${API_URL}/api/v1/refresh`, {
          method: "POST",
          headers: { Cookie: cookieHeader },
        });
        if (refreshRes.ok) {
          const setCookies = getSetCookieHeaders(refreshRes);
          if (setCookies.length) {
            newCookieHeaders.push(...setCookies);
            const newCookieString = setCookies
              .map((s) => s.split(";")[0].trim())
              .join("; ");
            const meRes = await fetch(`${API_URL}/api/v1/user/me/`, {
              method: "GET",
              headers: { Cookie: newCookieString },
            });
            if (!meRes.ok) return { user: null, newCookieHeaders };
            const userData = await meRes.json();
            return { user: userData, newCookieHeaders };
          }
        }
        return { user: null, newCookieHeaders };
      }

      if (!response.ok) return { user: null, newCookieHeaders };
      const userData = await response.json();
      return { user: userData, newCookieHeaders };
    } catch (error) {
      console.error("Error en el middleware de autenticación:", error);
      return { user: null, newCookieHeaders };
    }
  }

  const { user, newCookieHeaders } = await isAuthenticated();

  const appendNewCookies = (res: NextResponse) => {
    newCookieHeaders.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  };

  // 1. Si el usuario no está autenticado y trata de acceder a una ruta protegida
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl.toString());
  }

  // 2. Si el usuario está autenticado y trata de acceder a rutas de autenticación
  if (user && authRoutes.includes(pathname)) {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
    return appendNewCookies(NextResponse.redirect(dashboardUrl.toString()));
  }

  // 3. Verificar restricciones por rol
  if (user && user.role && (user.role as { name?: string }).name) {
    const roleName = (user.role as { name: string }).name.toLowerCase();
    const restrictedRoutes = roleRestrictedRoutes[roleName];
    if (restrictedRoutes?.some((route) => pathname.startsWith(route))) {
      const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
      return appendNewCookies(NextResponse.redirect(dashboardUrl.toString()));
    }
  }

  return appendNewCookies(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/login", 
    "/register", 
    "/agendar-cita/:path*"
  ]
};