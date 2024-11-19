import Header from "@/app/ui/about/Header";
import WhoAreWe from "../ui/about/whoAreWe";
import { Metadata } from "next";
import Footer from "../ui/navigation/footer";

export const metadata: Metadata =  {
  title: 'Sobre Nosotros',
}

export default function Home() {
  return (
    <div>
        <Header />
        <WhoAreWe />
        <Footer />
    </div>
  );
}
