"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchAndResults } from "./search-and-results";
import { DoctorBookingView } from "./doctor-booking-view";
import { DOCTOR_PARAM } from "@/lib/doctorProfileUrl";

export function AgendarCitaContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // El doctor elegido vive en la URL y no en useState: así el botón atrás
  // vuelve a los resultados en vez de sacar del sitio, refrescar mantiene el
  // perfil abierto, y un perfil se puede compartir o enlazar desde una cita.
  const selectedDoctorId = searchParams.get(DOCTOR_PARAM);

  if (selectedDoctorId) {
    return (
      <DoctorBookingView
        doctorId={selectedDoctorId}
        onBack={() => router.push(pathname)}
      />
    );
  }

  return (
    <SearchAndResults
      onSelectDoctor={(id) =>
        router.push(`${pathname}?${DOCTOR_PARAM}=${encodeURIComponent(id)}`)
      }
    />
  );
}
