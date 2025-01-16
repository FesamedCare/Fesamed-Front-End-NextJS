'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Lottie from 'react-lottie';
import PatientAnimation from '../../../../public/lottie/patient.json';
import DoctorAnimation from '../../../../public/lottie/doctor.json';

const RoleCard = ({ href, animationData, title, description } : any) => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  return (
    <Link href={href}>
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-square relative mb-4">
          <Lottie options={defaultOptions} />
        </div>
        <h2 className="text-xl font-semibold text-center mb-2">{title}</h2>
        <p className="text-gray-500 text-center">{description}</p>
      </Card>
    </Link>
  );
};

export default function RoleSelection() {
  return (
    <div className="container mx-auto max-w-[800px] px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold mb-2">Crea una cuenta 👋</h1>
        <p className="text-gray-500">Selecciona tu rol para comenzar</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <RoleCard
          href="/register/patient"
          animationData={PatientAnimation}
          title="Paciente"
          description="Encuentra y agenda citas con profesionales de la salud"
        />
        <RoleCard
          href="/register/doctor"
          animationData={DoctorAnimation}
          title="Doctor"
          description="Gestiona tu consulta y atiende pacientes en línea"
        />
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-500">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
