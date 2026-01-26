import Footer from "../ui/navigation/footer";
import { AgendarCitaContent } from "../ui/doctors/appointment-page/agendar-cita-content";

export default function AgendarCitaPage() {
  return (
    <>
      <main className="min-h-screen">
        <AgendarCitaContent />
      </main>
      <Footer />
    </>
  );
}