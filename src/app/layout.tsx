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
  title: "UniArriendos - Busca arriendos para universitarios",
  description: "Plataforma web colaborativa para búsqueda de arriendos de la comunidad UNIPAZ",
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
