import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Footer from "../ui/navigation/footer";
import { AgendarCitaContent } from "../ui/doctors/appointment-page/agendar-cita-content";

export default function BuscarDoctorPage() {
  return (
    <>
      <main className="min-h-screen">
        {/*
          AgendarCitaContent lee el doctor elegido de la URL con
          useSearchParams. Sin este Suspense, Next no puede prerenderizar la
          página y la ruta pasa de estática a dinámica.
        */}
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          }
        >
          <AgendarCitaContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
