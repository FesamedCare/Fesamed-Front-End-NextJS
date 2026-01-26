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

// Menú para usuarios no autenticados
const publicLinks = [
  {
    name: "Buscar Doctor",
    description: "Busca un doctor especializado",
    href: "/buscar-doctor",
  },
  {
    name: "Nosotros",
    description: "Aprende más sobre nosotros",
    href: "/about",
  },
  {
    name: "Blog",
    description: "Entérate de las últimas noticias",
    href: "/blog",
  },
  {
    name: "Contacto",
    description: "Contáctanos",
    href: "/contact",
  },
  {
    name: "Iniciar Sesión",
    description: "Inicia sesión en tu cuenta",
    href: "/login",
  },
  {
    name: "Registrarse",
    description: "Crea una cuenta nueva",
    href: "/register",
  }
];

// Menú para usuarios autenticados
const userLinks = [
  {
    name: "Buscar Doctor",
    description: "Busca un doctor especializado",
    href: "/buscar-doctor",
  },
  {
    name: "Nosotros",
    description: "Aprende más sobre nosotros",
    href: "/about",
  },
  {
    name: "Blog",
    description: "Entérate de las últimas noticias",
    href: "/blog",
  },
  {
    name: "Contacto",
    description: "Contáctanos",
    href: "/contact",
  },
  {
    name: "Mi Perfil",
    description: "Ver tu perfil y tus citas",
    href: "/dashboard",
  }
];

const solutionsDesktop = [
  {
    name: "Ver Perfil",
    description: "Ver tu perfil y tus citas",
    href: "/dashboard",
  },
  {
    name: "Mis Citas",
    description: "Gestionar mis citas médicas",
    href: "/dashboard/appointments",
  }
];

export default function Navbar() {
  const { user, isAuthenticated, loading, logout, refreshUser } = useAuthContext();
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

  const WelcomeButton = ({ open }: { open: boolean }) => (
    <div className="flex items-center border border-blue-500 py-1 px-4 rounded-full">
      <p className={`text-base font-medium ${open ? 'text-blue-500' : 'text-gray-900 hover:text-blue-500'} transition duration-200 ease-in-out`}>
        ¡Bienvenid@ {user?.name || 'Usuario'}! 👋
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
                src="https://fesamedcare.s3.us-east-2.amazonaws.com/FesaMedCareLogo.png"
                width={200}
                height={56}
                alt="FesaMedCare Logo"
                priority
                style={{ width: "auto", height: "auto" }}
              />
            </Link>
            <div className="ml-10 mt-11">
              <Link
                href="/buscar-doctor"
                className="4xl:text-lg text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4"
              >
                Buscar un Doctor
              </Link>
              <Link
                href="/about"
                className="4xl:text-lg text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4"
              >
                Nosotros
              </Link>
              <Link
                href="/blog"
                className="4xl:text-lg text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4"
              >
                Blog
              </Link>
              <Link
                href="/contact"
                className="4xl:text-lg text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4"
              >
                Contacto
              </Link>
            </div>
          </div>
          {(loading || !isAuthenticated) ? (
                <div className="ml-4 mt-4 flex-shrink-0">
                  <Link
                    href="/login"
                    className="mr-4 text-base font-medium text-blue-700"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-900 px-4 py-2 rounded-lg text-white hover:bg-blue-800 transition-all duration-200 ease-in-out text-base"
                  >
                    ¡Regístrate!
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
                                {solutionsDesktop.map((item) => (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-50"
                                  >
                                    <div className="ml-4">
                                      <p className="text-sm font-medium text-gray-900 hover:text-blue-500 transition duration-200 ease-in-out">
                                        {item.name}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {item.description}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                              <div className="bg-gray-50 p-4">
                                <button
                                  onClick={handleLogout}
                                  className="w-full rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                                >
                                  <span className="flex items-center">
                                    <span className="text-sm font-medium text-blue-500">
                                      Cerrar Sesión
                                    </span>
                                  </span>
                                  <span className="block text-sm text-gray-500 text-left">
                                    Cerrar sesión en tu cuenta
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
                src="https://fesamedcare.s3.us-east-2.amazonaws.com/FesaMedCareLogo.png"
                width={200}
                height={56}
                alt="FesaMedCare Logo"
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
                        {(loading || !isAuthenticated ? publicLinks : userLinks).map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="text-lg font-medium text-gray-900 hover:text-blue-500 transition duration-200 ease-in-out"
                          >
                            {item.name}
                          </Link>
                        ))}
                        {!loading && isAuthenticated && (
                          <button
                            onClick={handleLogout}
                            className="text-lg font-medium text-red-500 hover:text-red-700 transition duration-200 ease-in-out text-left mt-4 border-t pt-4"
                          >
                            Cerrar Sesión
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
