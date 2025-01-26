import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/dashboard/edit-profile"];
const avoidRoutes = ["/login", "/register"];

const roleRestrictedRoutes : any = {
  patient: ["/dashboard/edit-doctor-profile"],
  doctor: ["/dashboard/edit-patient-profile"]
};

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Consulta el endpoint del backend para validar autenticación y obtener rol
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
    method: "GET",
    headers: { Cookie: req.headers.get("cookie") || "" },
    credentials: "include",
  });

  if (!response.ok) {
    // No autenticado
    if (protectedRoutes.includes(pathname)) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl.toString());
    }
    return NextResponse.next();
  }

  // Obtener datos del usuario
  const userData = await response.json();
  const userRole = userData.role; // Asume que el backend devuelve el rol

  // Verificar rutas restringidas por rol
  if (roleRestrictedRoutes[userRole]?.includes(pathname)) {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl.toString());
  }

  // Verificar rutas públicas para usuarios autenticados
  if (avoidRoutes.includes(pathname)) {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl.toString());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"]
};
// import { isUserAuthenticated } from "@/session";
// import { NextRequest, NextResponse } from "next/server";

// const protectedRoutes = ["/dashboard"];

// export default function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   // Si el usuario no está autenticado e intenta acceder a una ruta protegida
//   if (!isUserAuthenticated && protectedRoutes.includes(pathname)) {
//     const loginUrl = new URL("/login", req.nextUrl.origin);
//     return NextResponse.redirect(loginUrl.toString());
//   }

// const avoidRoutes = ["/login", "/register"];

//   // Si el usuario está autenticado e intenta acceder a la página de inicio de sesión
//   if (isUserAuthenticated && avoidRoutes.includes(pathname)) {
//     const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
//     return NextResponse.redirect(dashboardUrl.toString());
//   }

//   // Continuar con la solicitud normalmente
//   return NextResponse.next();
// }