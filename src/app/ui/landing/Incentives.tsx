import Link from "next/link";
import "@/app/globals.css";

function Incentives() {
  return (
    <div className="faded-div ">
      <div className="2xl:mx-44 lg:mx-28 xl:mx-28 sm:mx-16 mx-5 flex justify-center lg:justify-between xl:justify-between md:justify-between">
        <div className="hidden lg:block xl:block">
          <div className="image-container">
            <img
              src="https://fesamedcare.s3.us-east-2.amazonaws.com/grid-doctors.png"
              alt="grid-doctors"
              width={500}
            />
          </div>
        </div>

        <div className=" flex-col py-20 lg:ml-10 xl:ml-10">
          <p className="font-semibold xl:block lg:block md:block md:text-4xl lg:text-4xl xl:text-4xl text-3xl tracking-tight pb-9">
            Miles de especialistas <br /> certificados - Online
          </p>

          <p className="text-lg text-gray-600 mb-8">
            Programa una cita con un Especialista sin hacer filas, sin largas{" "}
            <br /> esperas durante una llamada.{" "}
            <span className="text-blue-400 font-semibold">
              Agenda tu cita en un click! ✅
            </span>
          </p>

          <p className="text-md font-semibold pt-12">
            +25 especialidades médicas a tu disposición.
          </p>

          <ul className="flex flex-wrap gap-2 py-5 sm:flex-row items-center">
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service1"
                className=" leading-8 text-gray-600 sm:text-center"
              >
                Doctor General {">"}
              </Link>
            </li>
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service2"
                className=" leading-8 text-gray-600 sm:text-center"
              >
                Embarazo {">"}
              </Link>
            </li>
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service3"
                className="  leading-8 text-gray-600 sm:text-center"
              >
                Oftalmología {">"}
              </Link>
            </li>
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service3"
                className="  leading-8 text-gray-600 sm:text-center"
              >
                Psiquiatría {">"}
              </Link>
            </li>
            <li className="w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base  transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none">
              <Link
                href="/services/service3"
                className="  leading-8 text-gray-600 sm:text-center"
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
      </div>
    </div>
  );
}

export default Incentives;
