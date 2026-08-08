"use client";

import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import Image from "next/image";
import Menu from "./menu";
import CloseMenu from "./closeMenu";
import { useState, Fragment, useEffect } from "react";
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
      {open ? (
        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      ) : (
        <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      )}
    </div>
  );
  return (
    <nav
      id="navbar"
      className={`transition duration-300 ease-in-out w-full z-40 top-0 py-.5 fixed ${navbarShadow ? 'shadow-navbar bg-white' : ''}`}
    >
      <div className="xl:px-16 px-6 2xl:px-32 sm:px-16">
        {/* Desktop Navigation */}
        <div className="-ml-4 -mt-2 hidden lg:flex flex-wrap items-center justify-between sm:flex-nowrap md:px-14 px-2">
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
            <div className="ml-10 mt-11">
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
            </div>
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
                          <Popover.Panel className="absolute -right-28 z-10 mt-3 w-60 max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
                            <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                              <div className="relative grid gap-8 bg-white p-7">
                                {desktopLinks.map((item) => (
                                  <Link
                                    key={item.key}
                                    href={item.href}
                                    className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-50"
                                  >
                                    <div className="ml-4">
                                      <p className="text-sm font-medium text-gray-900 hover:text-blue-500 transition duration-200 ease-in-out">
                                        {t(item.key)}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {t(item.descKey)}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                              {/*
                                bg-white explícito: este bloque es hermano del
                                grid de enlaces (que sí lo trae) y de la franja
                                de cerrar sesión. Sin fondo propio se veía la
                                página a través del panel.
                              */}
                              <div className="border-t bg-white px-7 py-4">
                                <LanguagePicker />
                              </div>
                              <div className="bg-gray-50 p-4">
                                <button
                                  onClick={handleLogout}
                                  className="w-full rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                                >
                                  <span className="flex items-center">
                                    <span className="text-sm font-medium text-blue-500">
                                      {t("nav.logout")}
                                    </span>
                                  </span>
                                  <span className="block text-sm text-gray-500 text-left">
                                    {t("nav.logoutDesc")}
                                  </span>
                                </button>
                              </div>
                            </div>
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
    </nav>
  );
}
