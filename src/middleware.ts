import { NextRequest, NextResponse } from "next/server";
import { detectLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config";

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

  return withLocaleCookie(req, NextResponse.next());
}

/**
 * Escribe la cookie de idioma la primera vez que alguien llega.
 *
 * Sólo se escribe si no existe: una vez que el usuario eligió idioma a mano,
 * su elección manda sobre lo que diga el navegador. La detección es una
 * suposición inicial, no una regla permanente.
 */
function withLocaleCookie(req: NextRequest, res: NextResponse): NextResponse {
  const existing = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(existing)) return res;

  const locale = detectLocale(
    req.headers.get("accept-language"),
    // Lo pone el hosting (Vercel). Sin él, manda el Accept-Language.
    req.headers.get("x-vercel-ip-country")
  );

  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  // El idioma se detecta en cualquier ruta, así que el middleware corre en
  // todas menos los estáticos. Las reglas de sesión de arriba siguen
  // limitadas a sus rutas por los `startsWith` / `includes`.
  matcher: [
    "/((?!api|_next/static|_next/image|media|favicon.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
