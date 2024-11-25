import { isUserAuthenticated } from "@/session";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Si el usuario no está autenticado e intenta acceder a una ruta protegida
  if (!isUserAuthenticated && protectedRoutes.includes(pathname)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl.toString());
  }

const avoidRoutes = ["/login", "/register"];

  // Si el usuario está autenticado e intenta acceder a la página de inicio de sesión
  if (isUserAuthenticated && avoidRoutes.includes(pathname)) {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl.toString());
  }

  // Continuar con la solicitud normalmente
  return NextResponse.next();
}
