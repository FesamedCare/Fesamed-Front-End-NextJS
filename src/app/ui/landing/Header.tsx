import Link from "next/link";

function Header() {
  return (
    <main className="pt-5">
      <div className=" xl:px-6 px-6  2xl:px-20 sm:px-16">
        <div className="mx-auto md:mx-12 max-w-full xl:mx-24 xl:pt-16 xl:pb-26 lg:pt-16 md:pt-16 lg:pb-36 pt-0 pb-12">
          <div className="flex justify-between items-center">
            <div className="lg:-mt-8">
              <p className=" 2xl:text-xl py-3 text-blue-400 font-semibold">
                Bienvenid@ a FesamedCare 👋
              </p>
              <p className="4xl:text-4xl font-semibold xl:block lg:block md:block md:text-4xl lg:text-4xl xl:text-4xl text-3xl tracking-tight pb-9 hidden">
                Cambiando la forma en que <br /> recibes atención médica
              </p>

              {/* mobile text */}
              <p className="font-semibold xl:hidden md:hidden lg:hidden text-3xl tracking-tight pb-5">
                Cambiando la forma en que recibes atención médica
              </p>

              <p className="text-lg text-gray-600 mb-8">
                Aquí tu eliges especialistas certificados y con experiencia{" "}
                <br /> en el momento que lo necesitas.
              </p>
              <ul className="flex flex-col gap-8 py-10 sm:flex-row">
                <li className="inline-flex transition duration-300 ease-in-out border-b-2 border-transparent hover:border-blue-500 ">
                  <Link
                    href="/services/service1"
                    className=" text-lg leading-8 text-gray-600 sm:text-center"
                  >
                    Carillas de porcelana
                  </Link>
                </li>
                <li className="inline-flex transition duration-300 ease-in-out border-b-2 border-transparent hover:border-blue-500">
                  <Link
                    href="/services/service2"
                    className=" text-lg leading-8 text-gray-600 sm:text-center"
                  >
                    Cirugias Plásticas
                  </Link>
                </li>
                <li className="inline-flex transition duration-300 ease-in-out border-b-2 border-transparent hover:border-blue-500">
                  <Link
                    href="/services/service3"
                    className=" text-lg leading-8 text-gray-600 sm:text-center"
                  >
                    Implantes Dentales
                  </Link>
                </li>
              </ul>
              <div className="mt-8 flex gap-x-4">
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
                  href="/about"
                  className="inline-block rounded-lg px-4 py-1.5 text-base font-semibold leading-7 text-gray-900 ring-1 ring-gray-900/10 hover:ring-gray-900/20"
                >
                  Sobre nosotros
                  <span className="text-gray-400" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>

            <div className="4xl:mt-1 xl:-mt-14 hidden xl:block lg:block">
              <img
                src="https://fesamedcare.s3.us-east-2.amazonaws.com/MobileImgLanding.png"
                alt="mobile-image"
                className="w-[280px] 4xl:w-[320px]"
              />
            </div>

            <div className="hidden xl:block lg:hidden md:hidden shadow-navbar">
              <img
                src="https://fesamedcare.s3.us-east-2.amazonaws.com/calendar-example.png"
                alt="calendar-example"
                className="w-[280px] 4xl:w-[350px]"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Header;
