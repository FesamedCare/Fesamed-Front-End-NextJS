'use client';

import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { Switch } from '@headlessui/react'
import Link from 'next/link';
import { CircleLoader } from 'react-spinners';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css'
import '../../globals.css';

export default function Form () {
  return (
    <div>
         <div>
          <div className="relative bg-white">
          <div className="absolute inset-0">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gray-50" />
          </div>
          <div className="relative mx-auto max-w-7xl lg:grid lg:grid-cols-5">
            <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:col-span-2 lg:px-8 lg:py-14 xl:pr-12">
              <div className="mx-auto max-w-lg">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Contáctanos</h2>
                <p className="mt-3 text-lg leading-6 text-gray-500">
                  ¿Tienes alguna pregunta o comentario? ¡Estamos aquí para ayudarte!
                </p>
                <dl className="mt-8 text-base text-gray-500">
                  <div>
                    <dt className="sr-only">FesamedCare</dt>
                    <dd>
                      <p>Health Services Company </p>
                      <p>@FesamedCare</p>
                    </dd>
                  </div>
                  <div className="mt-6">
                    <dt className="sr-only">Phone number</dt>
                    <dd className="flex">
                      <PhoneIcon className="h-6 w-6 flex-shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="ml-3">+57 3207263798</span>
                    </dd>
                  </div>
                  <div className="mt-3">
                    <dt className="sr-only">Email</dt>
                    <dd className="flex">
                      <EnvelopeIcon className="h-6 w-6 flex-shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="ml-3">admin@fesamedcare.awsapps.com</span>
                    </dd>
                  </div>
                </dl>
                <p className="mt-6 text-base text-gray-500">
                  Necesitas algún especialista?{' '}
                  <Link href='/buscar-doctor' className="font-medium text-gray-700 underline">
                    Ver especialistas disponibles
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="bg-white py-16 px-4 sm:px-6 lg:col-span-3 lg:py-14 lg:px-8 xl:pl-12">
              <div className="mx-auto max-w-lg lg:max-w-none">
                <form onSubmit={e=>{}} className="grid grid-cols-1 gap-y-6">
    
                  <div>
                    <label htmlFor="full-name" className="sr-only">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="name"
                    //   value={name}
                      onChange={e=>{}}
                      required
                      autoComplete="name"
                      className="block w-full rounded-md border border-gray-300 py-3 px-4 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Nombre Completo"
                    />
                  </div>
    
                  <div>
                    <label htmlFor="email" className="sr-only">
                      Correo Electrónico
                    </label>
                    <input
                      name="email"
                      type="email"
                    //   value={email}
                      onChange={e=>{}}
                      required
                      className="block w-full rounded-md border border-gray-300 py-3 px-4 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Correo Electrónico"
                    />
                  </div>
    
                  <div>
                    <label htmlFor="phone" className="sr-only">
                      Teléfono
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                        <PhoneInput
                        value={''}
                        onChange={e=>{}}
                        country={'co'}
                        aria-describedby="price-currency"
                        containerClass="custom-phone-input"
                        />
                    </div>
                  </div>
    
                  <div>
                    <label  className="sr-only">
                      Asunto / Motivo
                    </label>
                    <input
                      type="text"
                      name="subject"
                    //   value={subject}
                      onChange={e=>{}}
                      required
                      autoComplete="name"
                      className="block w-full rounded-md border border-gray-300 py-3 px-4 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Asunto / Motivo"
                    />
                  </div>
    
                  <div>
                    <label htmlFor="message" className="sr-only">
                      Descripción
                    </label>
                    <textarea
                      name="message"
                    //   value={message}
                      onChange={e=>{}}
                      rows={4}
                      required
                      className="block w-full rounded-md border border-gray-300 py-3 px-4 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Descripción"
                      defaultValue={''}
                    />
                  </div>
    
                  <div>
                    <label htmlFor="message" className="sr-only">
                      Presupuesto (Opcional)
                    </label>
                    <select
                        name='budget'
                        onChange={e=>{}}
                        // value={budget}
                        className="block py-2 w-full pl-3 pr-10 rounded-md text-base border text-gray-500 border-gray-300 "
                    >
                        <option value="" className="text-gray-400">Selecciona un presupuesto (Opcional)</option>
                        <option value="0-5k" className="text-gray-600">$0 - 5000</option>
                        <option value="5-10k" className="text-gray-600">$5,000 - 10,000</option>
                        <option value="10-25k" className="text-gray-600">$10,000 - 25,000</option>
                    </select>
                  </div>
    
                  <div className=" py-5 ">
                    <div className="-ml-4 -mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap">
                      <div className="ml-4 mt-2">
                        <p className="leading-6 text-gray-500">
                        <Switch
                        //   checked={enabled}
                        //   onChange={setEnabled}
                          className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition data-[checked]:bg-blue-500 mr-4"
                        >
                          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
                        </Switch>
                          Acepto los <span className="font-medium"><Link href="/terms"> términios y condiciones </Link></span> y <span className="font-medium"><Link href="privacy">Politicas de privacidad</Link>  </span>.
                          </p>
                      </div>
                      <div className="ml-4 mt-2 flex-shrink-0">
                        {/* {
                          loading ? 
                          <div
                            className="relative inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-lg font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                              <CircleLoader loading={loading} size={15} color="#ffffff"/>
                          </div>
                          :
                        <button
                          type="submit"
                          className="relative inline-flex items-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Enviar
                        </button>
    
                        } */}
                          <button
                          type="submit"
                          className="relative inline-flex items-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                 </div>
                </form>
              </div>
            </div>
          </div>
        </div>
          </div>
    </div>
  );
}