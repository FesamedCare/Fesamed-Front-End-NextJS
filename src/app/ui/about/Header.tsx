'use client';

import Link from "next/link";
import { Typewriter } from "react-simple-typewriter";
import { useEffect, useRef } from "react";

function Header() {
    
  const typewriterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const firstChild = typewriterRef.current?.querySelector('span');
          if (firstChild && firstChild.textContent?.trim() == 'V') {
            firstChild.classList.add('text-blue-500');
            console.log('Vidas! is here');
          } else {
            firstChild?.classList.remove('text-blue-500');
          }
        }
      }
    });

    const currentRef = typewriterRef.current;
    if (currentRef) {
      observer.observe(currentRef, { childList: true, subtree: true });
    }


    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <div className="relative px-6 2xl:px-72 lg:px-8">
        <div className='mx-auto md:mx-24 max-w-full xl:mx-24 xl:pt-16 xl:pb-20 lg:pt-16 md:pt-16 lg:pb-36 pt-0 pb-14'>
          <div className='flex items-center justify-center'>
            <div className=' flex flex-col items-center'>
              <div className='pb-10 text-center'>
              <p className='py-3 text-blue-400 font-semibold text-lg'>
                FesamedCare | Qué hacemos ? 🧐
              </p>
              <div className="font-semibold text-center xl:block lg:block md:block md:text-7xl text-3xl lg:text-8xl tracking-tight pb-9">
                Transformamos la Salud,<br />
                Mejoramos <span></span>
                <span id='WritingContainer' ref={typewriterRef}>
                  <Typewriter
                    words={['Sonrisas', 'Bienestar', 'Vidas!']}
                    loop={0}
                    cursor
                    cursorStyle='_'
                    typeSpeed={90}
                    deleteSpeed={50}
                    delaySpeed={1000}
                  />
                </span>
              </div>
              </div>

              <p className='text-lg lg:text-center xl:text-center md:text-center text-justify  text-gray-500'>
              En FesamedCare, estamos revolucionando la forma en que recibes atención médica. Nuestro objetivo es conectar a los pacientes con especialistas certificados y experimentados en el momento que más lo necesitan. Creemos en brindar un servicio de calidad que sea accesible y eficiente, sin las molestias de las largas esperas y las filas interminables.
              </p>

              <div className="mt-12 flex gap-x-4 justify-around">
                <Link
                  href="/buscar-doctor"
                  className="inline-block rounded-lg bg-blue-500 px-4 py-1.5 text-base font-semibold leading-7 text-white shadow-sm ring-1 ring-blue-500 hover:bg-blue-500 hover:ring-blue-500"
                >
                  Encuentra un doctor
                  <span className="text-indigo-200" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
                <Link
                  href='/about'
                  className="inline-block rounded-lg px-4 py-1.5 text-base font-semibold leading-7 text-gray-900 ring-1 ring-gray-900/10 hover:ring-gray-900/20"
                >
                  Sobre nosotros
                  <span className="text-gray-400" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Header;