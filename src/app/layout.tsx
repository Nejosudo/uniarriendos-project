import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/componentes/layout/Navbar/Navbar";
import Footer from "@/componentes/layout/Footer/Footer";
import GlobalSuspensionBanner from "@/componentes/layout/GlobalSuspensionBanner/GlobalSuspensionBanner";
import ToastProvider from "@/componentes/ui/ToastProvider/ToastProvider";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "UniArriendos - Busca arriendos para universitarios en Barrancabermeja",
  description: "Plataforma web colaborativa para búsqueda de arriendos de la comunidad UNIPAZ. Encuentra habitaciones, apartamentos y casas para estudiantes y externos en Barrancabermeja.",
  applicationName: "UniArriendos",
  icons: {
    icon: [
      { url: "/brand/uniarriendos_icono.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/brand/favicon-32x32.png",
    apple: "/brand/apple-touch-icon.png",
  },
  keywords: "arriendos, universitarios, UNIPAZ, Barrancabermeja, habitaciones, apartamentos, casas",
  authors: [{ name: "UniArriendos" }],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: getSiteUrl(),
    siteName: "UniArriendos",
    title: "UniArriendos - Plataforma de arriendos para universitarios",
    description: "Encuentra arriendos para estudiantes de UNIPAZ en Barrancabermeja",
    images: [
      {
        url: `${getSiteUrl()}/og-image.png`,
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
    description: "Busca arriendos para estudiantes de UNIPAZ",
    creator: "@uniarriendos",
  },
  robots: "index, follow",
  alternates: {
    canonical: getSiteUrl(),
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
        <ToastProvider />
      </body>
    </html>
  );
}
