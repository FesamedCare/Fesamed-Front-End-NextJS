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

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Función para verificar autenticación
  async function isAuthenticated() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
        method: "GET",
        headers: { Cookie: req.headers.get("cookie") || "" },
        credentials: "include",
      });
      
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error en el middleware de autenticación:", error);
      return null;
    }
  }

  // Obtener información del usuario si está autenticado
  const user = await isAuthenticated();
  
  // 1. Si el usuario no está autenticado y trata de acceder a una ruta protegida
  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl.toString());
  }

  // 2. Si el usuario está autenticado y trata de acceder a rutas de autenticación
  if (user && authRoutes.includes(pathname)) {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl.toString());
  }

  // 3. Verificar restricciones por rol
  if (user && user.role && roleRestrictedRoutes[user.role]) {
    const restrictedRoutes = roleRestrictedRoutes[user.role];
    if (restrictedRoutes.some(route => pathname.startsWith(route))) {
      const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
      return NextResponse.redirect(dashboardUrl.toString());
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/login", 
    "/register", 
    "/agendar-cita/:path*"
  ]
};