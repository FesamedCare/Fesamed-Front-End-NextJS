'use client';

import {Popover, Transition} from '@headlessui/react';
import {ChevronDownIcon, ChevronUpDownIcon} from '@heroicons/react/20/solid';
import Link from 'next/link';
import Menu from './menu';
import CloseMenu from './closeMenu';
import { useState, Fragment, useEffect } from "react";
import '../../globals.css';

const solutions = [
    {
      name: 'Buscar Doctor',
      description: 'Busca un doctor especializado',
      href: '/buscar-doctor',
    },
    {
      name: 'Nosotros',
      description: 'Aprende más sobre nosotros',
      href: '/about',
    },
    {
      name: 'Blog',
      description: 'Entérate de las últimas noticias',
      href: '/blog',
    },
    {
      name: 'Contacto',
      description: 'Contáctanos',
      href: '/contact',
    },
    {
      name: 'Iniciar Sesión',
      description: 'Inicia sesión en tu cuenta',
      href: '/login',
    }
  ]

  const solutionsDesktop = [
    {
      name: 'Ver Perfil',
      description: 'Ver tu perfil y tus citas',
      href: '/dashboard',
    },
    // {
    //   name: 'Nosotros',
    //   description: 'Aprende más sobre nosotros',
    //   href: '/about',
    //   icon: IconTwo,
    // }
  ]
  
  export default function Navbar () {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
  
    // handlelogout function empty for now
    const handleLogout = () => {
      setIsLoggedIn(false);
    }

    useEffect(() => {
        console.log(isLoggedIn);
      }, []);

    useEffect(() => {
        const handleScroll = () => {
            const navbar = document.getElementById("navbar");
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add("shadow-navbar", "bg-white");
                } else {
                    navbar.classList.remove("shadow-navbar", "bg-white");
                }
            }
        };
    
        window.addEventListener("scroll", handleScroll);
    
        // Limpieza del efecto
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);
    return (
        <nav id="navbar" className="transition duration-300 ease-in-out w-full z-40 top-0 py-.5 fixed">
            <div className="xl:px-16 px-6  2xl:px-32 sm:px-16">
                 <div className="-ml-4 -mt-2 hidden lg:flex flex-wrap items-center justify-between sm:flex-nowrap md:px-14 px-2">
                  <div className="flex">
                         <Link href='/' className="mb-4 mt-6">
                             <img 
                             src='https://fesamedcare.s3.us-east-2.amazonaws.com/FesaMedCareLogo.png'
                             width={200}
                             height={180}
                             className=""/>
                         </Link>
                        <div className="ml-10 mt-11">
                        <Link href='/buscar-doctor' className="4xl:text-lg text-base  inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700  mx-4" >Buscar un Doctor</Link>
                        {/* <NavLink to='/cases' className="text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700  mx-4" >Cases</NavLink> */}
                        {/* <NavLink to='/services' className="text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4">Services</NavLink> */}
                        <Link href='/about' className="4xl:text-lg text-base  inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4">Nosotros</Link>
                        {/* <NavLink to='/careers' className="text-base inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4">Careers</NavLink> */}
                        <Link href='/blog' className="4xl:text-lg text-base  inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4">Blog</Link>
                        <Link href='/contact' className="4xl:text-lg text-base  inline-flex font-medium leading-6 text-blue-700 border-b-2 border-white transition duration-300 ease-in-out hover:border-blue-700 mx-4">Contacto</Link>
                          
                        </div>
                  </div>
                      {
                        isLoggedIn ? 
                        <div className="ml-4 mt-4 flex-shrink-0">
                       
                          {/* <button onClick={() => setOpen(!open)}>
                            {open ? <CloseMenu/> : <Menu/>}
                          </button> */}
                           
                           <Popover className="relative">
                        {({ open }) => (
                        <>
                            <Popover.Button
                            className={`
                                ${open ? '' : 'text-opacity-90'}
                                focus:ring-none focus:outline-none`}
                            >
                            {
                                open ?
                                <div className="flex items-center border border-blue-500 py-1 px-4 rounded-full">
                                    <p className="text-base font-medium text-blue-500  transition duration-200 ease-in-out ">
                                        Bienvenido ! 👋
                                    </p>
                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                :
                                // Si el usuario esta logueado, se muestra el nombre del usuario acompañado de un Bienvenido y un icono de flecha hacia abajo

                                <div className="flex items-center border border-blue-500 py-1 px-4 rounded-full">
                                    <p className="text-base font-medium text-gray-900 hover:text-blue-500 transition duration-200 ease-in-out ">
                                        Bienvenido ! 👋
                                    </p>
                                    <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                            }
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
                                <div className="relative grid gap-8 bg-white p-7 ">
                                    {solutionsDesktop.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="-m-3 flex items-center rounded-lg p-2  transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-50"
                                    >
                                        {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center text-white sm:h-12 sm:w-12">
                                        <item.icon aria-hidden="true" />
                                        </div> */}
                                        <div className="ml-4 " >
                                        <p className="text-sm font-medium text-gray-900 hover:text-blue-500 transition duration-200 ease-in-out ">
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
                                    className=" w-full rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
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
                      :
                      <Link
                        href="/login"
                        className="ml-12 mt-4 relative inline-flex items-center justify-center rounded-full border border-blue-700 bg-white-button px-5 py-1.5 text-base font-medium text-blue-700 transition duration-300 ease-in-out hover:bg-gray-100 focus:outline-none"
                        >
                       Iniciar Sesión
                      </Link>
                      }
                 </div>

                 {/* Mobile Navbar */}
                 <div className="-ml-4 -mt-2 lg:hidden flex flex-wrap items-center justify-between sm:flex-nowrap  md:px-14  px-2">
                         <Link href='/' className="ml-4 mt-6 mb-4">
                             <img 
                             src='https://fesamedcare.s3.us-east-2.amazonaws.com/FesaMedCareLogo.png'
                             width={180}
                             height={160}
                             className=""/>
                         </Link>
                        <div className="ml-4 mt-4 flex-shrink-0">
                       
                          {/* <button onClick={() => setOpen(!open)}>
                            {open ? <CloseMenu/> : <Menu/>}
                          </button> */}
                           
                           <Popover className="relative">
                        {({ open }) => (
                        <>
                            <Popover.Button
                            className={`
                                ${open ? '' : 'text-opacity-90'}
                                focus:ring-none focus:outline-none`}
                            >
                            {
                                open ?
                                <CloseMenu/>
                                :
                                <Menu/>
                            }
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
                            <Popover.Panel className="absolute -left-32 z-10 mt-3 w-screen max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
                                <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                                <div className="relative grid gap-8 bg-white p-7 lg:grid-cols-2">
                                    {solutions.filter(item => !(isLoggedIn && item.name === 'Iniciar Sesión')).map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="-m-3 flex items-center rounded-lg p-2  transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-50"
                                    >
                                        {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center text-white sm:h-12 sm:w-12">
                                        <item.icon aria-hidden="true" />
                                        </div> */}
                                        <div className="ml-4 " >
                                        <p className="text-sm font-medium text-gray-900 hover:text-blue-500 transition duration-200 ease-in-out ">
                                            {item.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {item.description}
                                        </p>
                                        </div>
                                    </Link>
                                    ))}
                                </div>
                                {
                                  isLoggedIn ?
                                  <div className="bg-gray-50 p-4">
                                    <button
                                    onClick={handleLogout}
                                    className=" w-full rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
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
                                :
                                <></>
                                }
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
    )
}