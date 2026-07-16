import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/componentes/layout/Navbar/Navbar";
import Footer from "@/componentes/layout/Footer/Footer";
import GlobalSuspensionBanner from "@/componentes/layout/GlobalSuspensionBanner/GlobalSuspensionBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniArriendos - Busca arriendos para universitarios en Barrancabermeja",
  description: "Plataforma web colaborativa para búsqueda de arriendos de la comunidad UNIPAZ. Encuentra habitaciones, apartamentos y casas para estudiantes y externos en Barrancabermeja.",
  keywords: "arriendos, universitarios, UNIPAZ, Barrancabermeja, habitaciones, apartamentos, casas",
  authors: [{ name: "UniArriendos" }],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://uniarriendos-project.vercel.app",
    siteName: "UniArriendos",
    title: "UniArriendos - Plataforma de arriendos para universitarios",
    description: "Encuentra arriendos seguros y verificados para estudiantes de UNIPAZ en Barrancabermeja",
    images: [
      {
        url: "https://uniarriendos-project.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "UniArriendos - Plataforma de arriendos",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UniArriendos",
    description: "Busca arriendos seguros para estudiantes de UNIPAZ",
    creator: "@uniarriendos",
  },
  robots: "index, follow",
  alternates: {
    canonical: "https://uniarriendos-project.vercel.app",
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <GlobalSuspensionBanner />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
