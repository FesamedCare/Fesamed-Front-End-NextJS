'use client';

import Link from "next/link";
import { Typewriter } from "react-simple-typewriter";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";

function Header() {
  const { t } = useTranslation();
    
  const typewriterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const firstChild = typewriterRef.current?.querySelector('span');
          if (firstChild && firstChild.textContent?.trim() == 'V') {
            firstChild.classList.add('text-blue-500');
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
    <main style={{height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div className="relative px-6 2xl:px-72 lg:px-8">
        <div className='mx-auto md:mx-24 max-w-full xl:mx-24 xl:pt-16 xl:pb-20 lg:pt-16 md:pt-16 lg:pb-36 pt-0 pb-14'>
          <div className='flex items-center justify-center'>
            <div className=' flex flex-col items-center'>
              <div className='pb-10 pt-8 md:pt-0 lg:pt-0 text-center'>
              <p className='py-3 text-blue-400 font-semibold text-lg'>
                {t("about.eyebrow")}
              </p>
              <div className="font-semibold text-center xl:block lg:block md:block md:text-7xl text-5xl h-52 lg:text-8xl tracking-tight pb-9">
                {t("about.titleLine1")}<br />
                {t("about.titleLine2")} <span></span>
                <span id='WritingContainer' ref={typewriterRef}>
                  <Typewriter
                    words={[t("about.typewriter1"), t("about.typewriter2"), t("about.typewriter3")]}
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

              <p className='text-base lg:text-center xl:text-center md:text-center lg:block md:block hidden  text-gray-500'>
              {t("about.body1")} {t("about.body2")} {t("about.body3")}
              </p>

              <article className='text-base sm:block lg:hidden md:hidden  text-gray-500'>
                <p className="mb-4">{t("about.body1")}</p>
                <p className="mb-4">{t("about.body2")}</p>
                <p>{t("about.body3")}</p>
                
              </article>

              <div className="mt-12 flex gap-x-4 justify-around">
                <Link
                  href="/buscar-doctor"
                  className="inline-block rounded-lg bg-blue-500 px-4 py-1.5 text-base font-semibold leading-7 text-white shadow-sm ring-1 ring-blue-500 hover:bg-blue-500 hover:ring-blue-500"
                >
                  {t("landing.ctaFindDoctor")}
                  <span className="text-indigo-200" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
                <Link
                  href='/about'
                  className="inline-block rounded-lg px-4 py-1.5 text-base font-semibold leading-7 text-gray-900 ring-1 ring-gray-900/10 hover:ring-gray-900/20"
                >
                  {t("about.ourBlog")}
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