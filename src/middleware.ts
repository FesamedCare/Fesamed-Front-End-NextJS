import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/agendar-cita"];

// Routes only accessible when NOT authenticated
const authRoutes = ["/login", "/register"];

// Role-based route restrictions (checked client-side after hydration)
const roleRestrictedRoutes: Record<string, string[]> = {
  patient: ["/dashboard/edit-doctor-profile"],
  doctor: ["/dashboard/edit-patient-profile"],
};

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Presence of refresh_token cookie is the gate: it means the user has
  // gone through the login flow. The client-side apiClient is responsible
  // for refreshing expired access tokens and redirecting on expiry.
  // We deliberately avoid calling the backend from middleware to prevent
  // a race condition where both the middleware and the client try to
  // refresh the same token simultaneously (blacklisting it twice).
  const hasSession = req.cookies.has("refresh_token");

  // 1. Unauthenticated user trying to reach a protected route
  if (!hasSession && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl.toString());
  }

  // 2. Authenticated user trying to reach login/register
  if (hasSession && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // 3. Role-based restrictions are enforced client-side after hydration
  //    (avoids needing to decode the JWT in the Edge runtime)

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/agendar-cita/:path*",
  ],
};
