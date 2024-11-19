import "./globals.css";
import Navbar from "./ui/navigation/Navbar";
import { Metadata } from "next";
import PageTransitionWrapper from "./Transition";

export const metadata: Metadata = {
  title: {
    template: '%s | FesamedCare',
    default: 'FesamedCare',
  },
  description: 'FesamedCare es una plataforma innovadora con sede en Cali, Colombia, dedicada a mejorar la calidad de vida de las personas a través de servicios médicos y dentales de primera clase.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
    <html lang="en" suppressHydrationWarning>
      <body>
        <Navbar />
        <PageTransitionWrapper>
        <div className="pt-24">{children}</div>
        </PageTransitionWrapper>
      </body>
    </html>
    </>
    
  );
}
