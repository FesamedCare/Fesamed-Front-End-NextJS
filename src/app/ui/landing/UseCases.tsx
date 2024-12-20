import Link from "next/link";
import Image from "next/image";

function UseCases() {
  return (
    <div className="">
      <div className="2xl:mx-36 lg:mx-20 xl:mx-20 md:mx-20 sm:mx-16 mx-5 flex lg:justify-between xl:justify-between md:justify-between pb-10 xl:py-16 md:py-16 lg:py-16">
        <div className="flex flex-col gap-10 py-24 lg:ml-10 xl:ml-10">
          <p className="4xl:text-5xl font-semibold xl:block lg:block md:block md:text-4xl lg:text-4xl xl:text-4xl text-3xl tracking-tight">
            Agendamiento en un Click <br /> con Doctores Certificados
          </p>
          <div>
            <ul className="flex flex-col gap-2 py-5">
              <li>+ 1500 Especialistas Certificados</li>
              <li>+ 25 Especialidades Médicas</li>
              <li>+ 1800 Recomendaciones de Pacientes</li>
              <li>+ 24 Mil Pacientes por año</li>
            </ul>
          </div>

          <div className="">
            <Image
              src="https://fesamedcare.s3.us-east-2.amazonaws.com/Review.png"
              alt="review"
              width={400}
              height={400} // Ajusta esta altura si es necesario
              priority
            />
          </div>
        </div>

        <div className="hidden lg:block xl:block">
          <div className="pr-12 pt-20 2xl:pr-14">
            <Image
              src="https://fesamedcare.s3.us-east-2.amazonaws.com/calendar-app-example.png"
              alt="calendar-app-example"
              width={450}
              height={450} // Ajusta esta altura si es necesario
              className="w-[450px] 4xl:w-[520px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default UseCases;
