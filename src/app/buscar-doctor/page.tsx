import { DoctorsSection } from "../ui/doctors/DoctorFinder/doctors-section";
import { SearchSection } from "../ui/doctors/DoctorFinder/search-section";
import Footer from "../ui/navigation/footer";

export default function Contact () {
  return (
    <>
    <main className="min-h-screen py-12 space-y-8">
        <SearchSection />
        <DoctorsSection />
    </main>
        <Footer />
    </>
  );
}