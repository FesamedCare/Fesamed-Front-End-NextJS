import AppointmentPage from "../ui/doctors/appointment-page/appointment-page";
import Footer from "../ui/navigation/footer";
import { SearchSection } from "../ui/doctors/appointment-page/search-section";

export default function Contact () {
  return (
    <>
        <SearchSection />
        <AppointmentPage />
        <Footer />
    </>
  );
}