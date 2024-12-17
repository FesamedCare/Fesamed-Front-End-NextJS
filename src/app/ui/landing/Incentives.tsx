import Link from "next/link";
import Image from "next/image";
import "@/app/globals.css";

function Incentives() {
  return (
    <div className="faded-div">
      <div className="2xl:mx-44 lg:mx-28 xl:mx-28 sm:mx-16 mx-5 flex justify-center lg:justify-between xl:justify-between md:justify-between">
        <div className="hidden lg:block xl:block">
          <div className="image-container">
            <Image
              src="https://fesamedcare.s3.us-east-2.amazonaws.com/grid-doctors.png"
              alt="grid-doctors"
              width={500}
              height={500} // Ajusta esto según tus necesidades
              priority // Opcional: da prioridad a esta imagen en la carga inicial
            />
          </div>
        </div>

        <div className="flex-col py-20 lg:ml-10 xl:ml-10">
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
            {[
              "Doctor General",
              "Embarazo",
              "Oftalmología",
              "Psiquiatría",
              "Otros",
            ].map((service, index) => (
              <li
                key={index}
                className="group w-40 lg:w-auto xl:w-auto md:w-auto inline-flex relative items-center justify-center rounded-full border border-gray-500 bg-white-button px-3 text-base transition duration-300 ease-in-out hover:bg-gray-200 focus:outline-none"
              >
                <Link
                  href={`/services/service${index + 1}`}
                  className="leading-8 flex justify-center items-center gap-2 text-gray-600 sm:text-center"
                >
                  {service}
                  <svg
                    className="arrow-icon transition-transform duration-300 ease-in-out"
                    width="9"
                    height="8"
                    viewBox="0 0 9 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.49966 1.01851C8.50988 0.742553 8.29446 0.510563 8.01851 0.500342L3.52159 0.33379C3.24564 0.32357 3.01365 0.538989 3.00343 0.814942C2.99321 1.09089 3.20862 1.32288 3.48458 1.33311L7.48184 1.48115L7.33379 5.47841C7.32357 5.75436 7.53899 5.98635 7.81494 5.99657C8.09089 6.0068 8.32288 5.79138 8.3331 5.51542L8.49966 1.01851ZM1.34023 7.8664L8.34023 1.3664L7.65977 0.633603L0.659774 7.1336L1.34023 7.8664Z"
                      fill="#4479E2"
                    ></path>
                  </svg>
                </Link>
              </li>
            ))}
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
