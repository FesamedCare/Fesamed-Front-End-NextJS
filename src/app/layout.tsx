import "./globals.css";
import Navbar from "./ui/navigation/Navbar";
import { Metadata } from "next";
import PageTransitionWrapper from "./Transition";
import { Inter } from 'next/font/google'
import { AuthProvider } from "@/contexts/AuthContext";

export const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
  title: {
    template: '%s | FesamedCare',
    default: 'FesamedCare',
  },
  description: 'FesamedCare es una plataforma innovadora con sede en Cali, Colombia, dedicada a mejorar la calidad de vida de las personas a través de servicios médicos y dentales de primera clase.',
  icons: {
    icon: '/favicon.png',
  }
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
          {/*
            Todo va dentro de un único elemento raíz, a propósito.

            Headless UI v2 decide qué clic es "afuera" en use-root-containers.js:
            recorre los hijos directos de html y body, y a cada uno que NO
            contiene su main tree node lo marca como contenedor interno.
            useOutsideClick no cierra si el clic cae dentro de un contenedor.

            Con <Navbar /> y el contenido como hermanos de primer nivel, el
            subárbol del contenido quedaba marcado como interno: el menú de
            usuario cerraba al hacer clic sobre la navbar, pero no sobre la
            página. Ver scripts/layout-single-root.test.mjs.
          */}
          <div id="app-root">
            <AuthProvider>
              <Navbar />
              <PageTransitionWrapper>
                <div className="pt-24">{children}</div>
              </PageTransitionWrapper>
            </AuthProvider>
          </div>
        </body>
      </html>
    </>
  );
}
