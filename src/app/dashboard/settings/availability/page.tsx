import { redirect } from "next/navigation";

// La disponibilidad salió de Configuración: es una tarea frecuente del doctor,
// no un ajuste de cuenta. Esta ruta queda sólo para no romper enlaces viejos.
export default function DisponibilidadRedirectPage() {
  redirect("/dashboard/availability");
}
