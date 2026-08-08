import Link from "next/link";
import Image from "next/image";
import Spline from "@splinetool/react-spline/next";
import "./header.css";
import { getTranslations } from "@/i18n/server";
import { Multiline, flatten } from "@/i18n/Multiline";

async function Header() {
  const { t } = await getTranslations();

  return (
    <main className="relative pt-5 lg:h-[90vh] md:h-[90vh] xl:lg:h-[90vh] h-auto transition-all duration-300 ease-in-out">
      {/* Spline background for large screens */}
      <div className="opacity-0 md:opacity-100 transform md:transform-none transition-all duration-500 ease-in-out absolute inset-0 z-3 ml-40 custom-margin">
        <Spline scene="https://prod.spline.design/DtxFAStj7rWMQwhq/scene.splinecode" />
      </div>

      <div className="xl:px-6 px-6 2xl:px-20 sm:px-16 transition-all duration-300">
        <div className="mx-auto md:mx-12 max-w-full xl:mx-24 xl:pt-16 xl:pb-26 lg:pt-16 md:pt-16 lg:pb-36 pt-0 pb-12 transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="lg:mt-5 z-10 transition-all duration-300">
              <p className="text-center md:text-left lg:text-left xl:text-left 2xl:text-xl pb-3 text-blue-400 text-lg font-semibold transform transition-all duration-300">
                {t("landing.welcome")}
              </p>
              <p className="4xl:text-5xl header opacity-0 md:opacity-100 transform translate-y-4 md:translate-y-0 transition-all duration-500 ease-in-out font-semibold xl:block lg:block md:block md:text-4xl lg:text-4xl xl:text-4xl text-3xl tracking-tight pb-9 hidden">
                <Multiline text={t("landing.headline")} />
              </p>

              {/* Mobile text with fade transition */}
              <p className="font-semibold header leading-4 opacity-100 md:opacity-0 transform transition-all duration-500 ease-in-out xl:hidden md:hidden lg:hidden headertext text-center tracking-tight pb-5">
                {flatten(t("landing.headline"))}
              </p>

              <p className="text-lg text-gray-500 md:mb-8 lg:mb-8 xl:mb-8 mb-0 pt-8 md:pt-0 transform transition-all duration-300">
                <Multiline text={t("landing.subhead")} />
              </p>

              <ul className="flex flex-col gap-4 py-10 sm:flex-row transition-all duration-300">
                {[
                  { href: "/services/service1", text: t("landing.serviceVeneers") },
                  { href: "/services/service2", text: t("landing.serviceSurgery") },
                  { href: "/services/service3", text: t("landing.serviceImplants") },
                ].map((item, index) => (
                  <li
                    key={index}
                    className="inline-flex transform transition-all duration-300 hover:scale-105"
                  >
                    <Link
                      href={item.href}
                      className="text-lg leading-8 text-gray-500 sm:text-center transition-all duration-300 ease-in-out border-b-2 border-transparent hover:border-blue-500"
                    >
                      {item.text}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* imagen que solo es visible en mobile */}
              <div className="block md:hidden transition-all duration-500 ease-in-out">
                <div className="flex items-center justify-center">
                <Image
                  src="https://fesamedcare.s3.us-east-2.amazonaws.com/MobileImgLanding.png"
                  alt="mobile-img-landing"
                  width={280}
                  height={350}
                />
                </div>
              </div>

              <div className="mt-8 flex gap-x-4 transition-all duration-300">
                <Link
                  href="/buscar-doctor"
                  className="inline-block rounded-lg bg-blue-500 px-4 py-1.5 text-base font-semibold leading-7 text-white shadow-sm ring-1 ring-blue-500 hover:bg-blue-500 hover:ring-blue-500 transform transition-all duration-300 hover:scale-105"
                >
                  {t("landing.ctaFindDoctor")}
                  <span
                    className="text-indigo-200 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    &rarr;
                  </span>
                </Link>
                <Link
                  href="/about"
                  className="inline-block rounded-lg px-4 py-1.5 text-base font-semibold leading-7 text-gray-900 ring-1 ring-gray-900/10 hover:ring-gray-900/20 transform transition-all duration-300 hover:scale-105"
                >
                  {t("landing.ctaAbout")}
                  <span
                    className="text-gray-400 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>

            <div className="hidden xl:block lg:hidden md:hidden shadow-navbar opacity-0 xl:opacity-100 transform translate-x-4 xl:translate-x-0 transition-all duration-500 ease-in-out">
              <Image
                src="/media/calendar-example.png"
                alt="calendar-example"
                width={280}
                height={350}
                className="w-[280px] 4xl:w-[350px] transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Header;
