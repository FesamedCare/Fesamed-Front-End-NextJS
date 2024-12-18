import Link from "next/link";
import "@/app/globals.css";
import aboutUsSVG from '@/../public/media/abooutus.svg';
import Image from "next/image";

function WhoAreWe() {
  return (
    <article className="faded-div mb-8">
      <div className="lg:mx-28 xl:mx-28 md:mx-28 mx-5 flex justify-center lg:justify-between xl:justify-between md:justify-between">
        <div className=" flex-col py-20 lg:ml-10 xl:ml-10 lg:w-1/2 xl:w-1/2">
          <p className="font-semibold xl:block lg:block md:block md:text-4xl lg:text-4xl xl:text-4xl text-3xl tracking-tight pb-9">
            Quienes somos ?
          </p>

          <p className="text-lg text-gray-500 mb-8">
            Somos una plataforma innovadora con sede en Cali, Colombia, dedicada
            a mejorar la calidad de vida de las personas a través de servicios
            médicos y dentales de primera clase. Ofrecemos una amplia gama de
            especialidades, incluyendo tratamientos dentales como diseño de
            sonrisa e implantes dentales, así como cirugías plásticas realizadas
            por expertos.
          </p>

          <p className="text-md font-semibold pt-12">
            +25 especialidades médicas a tu disposición.
          </p>

          <ul className="flex flex-wrap gap-2 py-5 sm:flex-row items-center">
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service1"
                className=" leading-8 text-gray-500 sm:text-center"
              >
                Doctor General {">"}
              </Link>
            </li>
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service2"
                className=" leading-8 text-gray-500 sm:text-center"
              >
                Embarazo {">"}
              </Link>
            </li>
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service3"
                className="  leading-8 text-gray-500 sm:text-center"
              >
                Oftalmología {">"}
              </Link>
            </li>
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service3"
                className="  leading-8 text-gray-500 sm:text-center"
              >
                Psiquiatría {">"}
              </Link>
            </li>
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service3"
                className="  leading-8 text-gray-500 sm:text-center"
              >
                Otros {">"}
              </Link>
            </li>
          </ul>

          <div className="mt-8 flex gap-x-4">
            <Link
              href="/register"
              className="inline-block rounded-lg bg-blue-500 px-4 py-1.5 text-base font-semibold leading-7 text-white shadow-sm ring-1 ring-blue-500 hover:bg-blue-500 hover:ring-blue-500"
            >
              Crear cuenta
              <span className="text-indigo-200" aria-hidden="true">
                &rarr;
              </span>
            </Link>
            <Link
              href="/buscar-doctor"
              className="inline-block rounded-lg px-4 py-1.5 text-base font-semibold leading-7 text-gray-900 ring-1 ring-gray-900/10 hover:ring-gray-900/20"
            >
              Buscar especialista
              <span className="text-gray-400" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 xl:w-1/2">
          <Image
            src={aboutUsSVG}
            alt="About Us Illustration"
            className="w-full h-auto"
          />
        </div>
      </div>
    </article>
  );
}

export default WhoAreWe;
