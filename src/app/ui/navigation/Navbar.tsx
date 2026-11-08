"use client";

import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import Image from "next/image";
import Menu from "./menu";
import CloseMenu from "./closeMenu";
import { useState, Fragment, useEffect } from "react";
import { motion, useTransform } from "framer-motion";
import { useSearchDock } from "@/contexts/SearchDockContext";
import { SearchDockPill } from "@/components/SearchDockPill";
import { RoleBadge } from "@/components/RoleBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, Globe, LayoutDashboard, LogOut, ShieldCheck, type LucideIcon } from "lucide-react";
import "../../globals.css";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";
import { LOCALES, type Locale } from "@/i18n/config";

interface NavItem {
  key: TranslationKey;
  descKey: TranslationKey;
  href: string;
}

// Menú para usuarios no autenticados
  // El Blog está fuera de la navegación a propósito: el frontend está hecho pero
  // el backend nunca se construyó. No hay tabla de posts, ni endpoint, ni forma
  // de escribir uno, así que /blog solo muestra "No hay publicaciones
  // disponibles". El código del front queda intacto: para reponerlo alcanza con
  // devolver este enlace, una vez que existan GET /posts y GET /categories.
const publicLinks: NavItem[] = [
  { key: "nav.searchDoctor", descKey: "nav.searchDoctorDesc", href: "/buscar-doctor" },
  { key: "nav.about", descKey: "nav.aboutDesc", href: "/about" },
  { key: "nav.contact", descKey: "nav.contactDesc", href: "/contact" },
  { key: "nav.login", descKey: "nav.loginDesc", href: "/login" },
  { key: "nav.register", descKey: "nav.registerDesc", href: "/register" },
];

// Menú para usuarios autenticados
const userLinks: NavItem[] = [
  { key: "nav.searchDoctor", descKey: "nav.searchDoctorDesc", href: "/buscar-doctor" },
  { key: "nav.about", descKey: "nav.aboutDesc", href: "/about" },
  { key: "nav.contact", descKey: "nav.contactDesc", href: "/contact" },
  { key: "nav.myProfile", descKey: "nav.myProfileDesc", href: "/dashboard" },
];

const solutionsDesktop: NavItem[] = [
  { key: "nav.viewProfile", descKey: "nav.myProfileDesc", href: "/dashboard" },
  { key: "nav.myAppointments", descKey: "nav.myAppointmentsDesc", href: "/dashboard/appointments" },
];

const adminLinks: NavItem[] = [
  { key: "nav.adminPanel", descKey: "nav.adminPanelDesc", href: "/admin/review-queue" },
];

// Publicar horarios es la tarea que un doctor repite cada semana. Vivía dentro
// de Configuración > Perfil y visibilidad, a tres clics y detrás de un acordeón
// cerrado. Ahora cuelga del menú, al lado de Mis Citas.
const doctorLink: NavItem = {
  key: "nav.availability",
  descKey: "nav.availabilityDesc",
  href: "/dashboard/availability",
};

const LOCALE_LABELS: Record<Locale, string> = { es: "Español", en: "English" };

/** Ícono de cada opción del menú de la cuenta. */
const MENU_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/appointments": CalendarDays,
  "/dashboard/availability": Clock,
  "/admin/review-queue": ShieldCheck,
};

/**
 * La sombra `shadow-navbar` de Tailwind con una intensidad de 0 a 1, para
 * poder mezclarla con el scroll en la página de búsqueda.
 */
function navbarShadowCss(intensity: number): string {
  const a = (0.03 * intensity).toFixed(4);
  return `0px 10px 8px 0px rgba(3,3,4,${a}), 0 1px 2px -1px rgba(3,3,4,${a})`;
}

export default function Navbar() {
  const { user, isAuthenticated, loading, logout, refreshUser } = useAuthContext();
  const { t, locale, setLocale } = useTranslation();
  const userRole = typeof user?.role === "string" ? user.role : (user?.role as { name?: string } | undefined)?.name;
  const isAdmin = userRole === "admin";
  const isDoctor = userRole === "doctor";
  const desktopLinks = isAdmin
    ? adminLinks
    : isDoctor
    ? [...solutionsDesktop, doctorLink]
    : solutionsDesktop;
  const mobileLinks = isDoctor ? [...userLinks, doctorLink] : userLinks;
  const [navbarShadow, setNavbarShadow] = useState(false);
  const searchDock = useSearchDock();
  const pathname = usePathname();
  // Barra de búsqueda acoplada: los enlaces ceden el centro a la píldora.
  const showPill = searchDock.available && searchDock.docked;
  // Los enlaces se van con el scroll y ya no se ven a mitad del recorrido de
  // la barra: así el centro está libre cuando llega la píldora.
  const linksOpacity = useTransform(searchDock.dockProgress, [0, 0.5], [1, 0]);
  const linksY = useTransform(searchDock.dockProgress, [0, 0.5], [0, -14]);
  // Con barra acoplable, la sombra vuelve cuando el título y los enlaces ya se
  // fueron (entre el 50 % y el 80 % del recorrido): separa la navbar de las
  // tarjetas sin aparecer de golpe ni competir con la transición.
  const dockShadow = useTransform(searchDock.dockProgress, [0.5, 0.8], [0, 1], { clamp: true });
  const dockShadowCss = useTransform(dockShadow, navbarShadowCss);

  // Detectar cambios de autenticación
  useEffect(() => {
    const handleAuthChange = (event: StorageEvent) => {
      if (event.key === 'auth_event') {
        console.log("Cambio de autenticación detectado, actualizando Navbar");
        refreshUser();
      }
    };

    // Obtener usuario al cargar
    refreshUser();
    
    // Registrar listener para eventos de localStorage
    window.addEventListener('storage', handleAuthChange);
    
    console.log("Estado de autenticación en Navbar:", { isAuthenticated, user, loading });
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [refreshUser]);

  const handleLogout = async () => {
    try {
      await logout();
      // Notificar a otras pestañas sobre el logout
      localStorage.setItem('auth_event', Date.now().toString());
      console.log("Logout exitoso");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setNavbarShadow(true);
      } else {
        setNavbarShadow(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // La detección por navegador es una suposición, no un veredicto. Sin una
  // forma de corregirla, alguien con el navegador en inglés que prefiere
  // español queda atrapado.
  const LanguagePicker = ({ className = "" }: { className?: string }) => (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1.5">
        {t("nav.languageLabel")}
      </p>
      <div className="flex gap-2">
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-current={locale === code}
            className={`text-sm px-2.5 py-1 rounded-full border transition-colors ${
              locale === code
                ? "border-blue-500 text-blue-600 font-medium"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {LOCALE_LABELS[code]}
          </button>
        ))}
      </div>
    </div>
  );

  const WelcomeButton = ({ open }: { open: boolean }) => (
    <div className="flex items-center border border-blue-500 py-1 px-4 rounded-full">
      <p className={`text-base font-medium ${open ? 'text-blue-500' : 'text-gray-900 hover:text-blue-500'} transition duration-200 ease-in-out`}>
        {t("nav.welcome")} {user?.name || ""}! 👋
      </p>
      {/* Tipo de cuenta siempre a la vista: doctor y paciente ven paneles distintos. */}
      <span className="ml-2">
        <RoleBadge role={userRole} size="sm" />
      </span>
      {open ? (
        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      ) : (
        <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      )}
    </div>
  );
  return (
    <motion.nav
      id="navbar"
      className={`transition-shadow duration-300 ease-in-out w-full z-40 top-0 py-.5 fixed ${
        navbarShadow || showPill ? "bg-white" : ""
      }`}
      style={{
        boxShadow: searchDock.available ? dockShadowCss : navbarShadowCss(navbarShadow ? 1 : 0),
      }}
    >
      <div className="xl:px-16 px-6 2xl:px-32 sm:px-16">
        {/* Desktop Navigation */}
        <div className="relative -ml-4 -mt-2 hidden lg:flex flex-wrap items-center justify-between sm:flex-nowrap md:px-14 px-2">
          <div className="flex">
            <Link href="/" className="mb-4 mt-6 h-14 w-48">
              <Image
                src="/media/logo-nav.png"
                width={200}
                height={56}
                alt={t("ui.altLogo")}
                priority
                style={{ width: "auto", height: "auto" }}
              />
            </Link>
            {/* Como las pestañas de la referencia: suben y se desvanecen al
                aparecer la píldora, y vuelven al desacoplar. */}
            <motion.div
              className="ml-10 mt-11"
              style={{ opacity: linksOpacity, y: linksY, pointerEvents: showPill ? "none" : "auto" }}
              aria-hidden={showPill}
            >
              <Link
                href="/buscar-doctor"
                className="4xl:text-lg text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4"
              >
                {t("nav.searchDoctor")}
              </Link>
              <Link
                href="/about"
                className="4xl:text-lg text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4"
              >
                {t("nav.about")}
              </Link>
              <Link
                href="/contact"
                className="4xl:text-lg text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4"
              >
                {t("nav.contact")}
              </Link>
            </motion.div>
          </div>

          {/* Píldora compacta de búsqueda: la barra de la página se transforma
              en ella al bajar y vuelve a crecer al subir (ver morphFrom). */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {showPill && <SearchDockPill />}
          </div>
          {(loading || !isAuthenticated) ? (
                <div className="ml-4 mt-4 flex-shrink-0">
                  <Link
                    href="/login"
                    className="mr-4 text-base font-medium text-blue-700"
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-900 px-4 py-2 rounded-lg text-white hover:bg-blue-800 transition-all duration-200 ease-in-out text-base"
                  >
                    {t("nav.register")}
                  </Link>
                </div>
              ) : (
                <div className="ml-4 mt-4 flex-shrink-0">
                  <Popover className="relative">
                    {({ open }) => (
                      <>
                        <Popover.Button
                          className={`${open ? "" : "text-opacity-90"} focus:ring-none focus:outline-none`}
                        >
                          <WelcomeButton open={open} />
                        </Popover.Button>

                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="opacity-0 translate-y-1"
                          enterTo="opacity-100 translate-y-0"
                          leave="transition ease-in duration-150"
                          leaveFrom="opacity-100 translate-y-0"
                          leaveTo="opacity-0 translate-y-1"
                        >
                          {/*
                            Menú de la cuenta. Antes cada opción tenía una
                            descripción debajo y el panel era casi todo texto.
                            Ahora: quién eres arriba, opciones de una línea con
                            ícono, idioma compacto y cerrar sesión aparte.
                          */}
                          <Popover.Panel className="absolute right-0 z-10 mt-2 w-72 origin-top-right">
                            {({ close }) => (
                            <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                                <UserAvatar
                                  src={(user?.profile_picture as string | null | undefined) ?? undefined}
                                  name={user?.name}
                                  lastname={user?.lastname}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-gray-900">
                                    {[user?.name, user?.lastname].filter(Boolean).join(" ")}
                                  </p>
                                  <p className="truncate text-xs text-gray-500" title={user?.email}>{user?.email}</p>
                                  <div className="mt-1">
                                    <RoleBadge role={userRole} size="sm" />
                                  </div>
                                </div>
                              </div>

                              <nav className="border-t border-gray-100 p-1.5">
                                {desktopLinks.map((item) => {
                                  const Icon = MENU_ICONS[item.href] ?? LayoutDashboard;
                                  const active = pathname === item.href;
                                  return (
                                    <Link
                                      key={item.key}
                                      href={item.href}
                                      onClick={() => close()}
                                      aria-current={active ? "page" : undefined}
                                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                        active ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                      }`}
                                    >
                                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`} aria-hidden />
                                      {t(item.key)}
                                    </Link>
                                  );
                                })}
                              </nav>

                              <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-2.5">
                                <span className="flex items-center gap-2 text-sm text-gray-600">
                                  <Globe className="h-4 w-4 text-gray-400" aria-hidden />
                                  {t("nav.languageLabel")}
                                </span>
                                <div role="group" aria-label={t("nav.languageLabel")} className="flex rounded-full bg-gray-100 p-0.5">
                                  {LOCALES.map((code) => (
                                    <button
                                      key={code}
                                      type="button"
                                      onClick={() => setLocale(code)}
                                      aria-pressed={locale === code}
                                      title={LOCALE_LABELS[code]}
                                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase transition-colors ${
                                        locale === code ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                      }`}
                                    >
                                      {code}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="border-t border-gray-100 p-1.5">
                                <button
                                  type="button"
                                  onClick={() => { close(); handleLogout(); }}
                                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                >
                                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                                  {t("nav.logout")}
                                </button>
                              </div>
                            </div>
                            )}
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                </div>
              )}
        </div>
        
        {/* Mobile Navigation */}
        <div className="flex justify-between items-center py-4 lg:hidden">
          <div className="h-10 w-44">
            <Link href="/">
              <Image
                src="/media/logo-nav.png"
                width={200}
                height={56}
                alt={t("ui.altLogo")}
                style={{ width: "auto", height: "auto" }}
              />
            </Link>
          </div>
          
          <div className="flex items-center">
            {/* Eliminamos el botón de bienvenida en versión móvil */}
            <Popover>
              {({ open }) => (
                <>
                  <Popover.Button className="focus:outline-none">
                    {open ? <CloseMenu /> : <Menu />}
                  </Popover.Button>
                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Popover.Panel className="absolute top-10 right-0 w-screen h-screen mt-10 origin-top-right bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="flex flex-col p-8 mt-10 gap-4">
                        {!loading && isAuthenticated && (
                          <div className="flex items-center gap-2 border-b pb-4">
                            <span className="text-lg font-medium text-gray-900">{user?.name}</span>
                            <RoleBadge role={userRole} size="sm" />
                          </div>
                        )}
                        {/* Mostrar enlaces: cuando está cargando o no autenticado → enlaces públicos (incl. Iniciar sesión, Registrarse) */}
                        {(loading || !isAuthenticated ? publicLinks : mobileLinks).map((item) => (
                          <Link
                            key={item.key}
                            href={item.href}
                            className="text-lg font-medium text-gray-900 hover:text-blue-500 transition duration-200 ease-in-out"
                          >
                            {t(item.key)}
                          </Link>
                        ))}
                        <LanguagePicker className="mt-4 border-t pt-4" />
                        {!loading && isAuthenticated && (
                          <button
                            onClick={handleLogout}
                            className="text-lg font-medium text-red-500 hover:text-red-700 transition duration-200 ease-in-out text-left mt-4 border-t pt-4"
                          >
                            {t("nav.logout")}
                          </button>
                        )}
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
