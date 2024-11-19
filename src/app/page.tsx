import Header from "./ui/landing/Header";
import Incentives from "./ui/landing/Incentives";
import UseCases from "./ui/landing/UseCases";
import Footer from "./ui/navigation/footer";
import { Metadata } from "next";

export const metadata: Metadata =  {
  title: 'Fesamed Care',
}

export default function Home() {
  return (
    <div>
        <Header />
        <Incentives />
        <UseCases />
        <Footer />
    </div>
  );
}
