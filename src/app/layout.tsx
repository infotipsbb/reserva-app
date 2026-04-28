import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Reservas Club Deportivo Minvu Serviu",
    template: "%s | Club Deportivo Minvu Serviu",
  },
  description:
    "Reserva tu cancha deportiva de forma fácil, rápida y segura. Canchas de fútbol, tenis y gimnasio polideportivo.",
  keywords: [
    "reservas",
    "canchas",
    "fútbol",
    "tenis",
    "gimnasio",
    "club deportivo",
    "Minvu Serviu",
    "deporte",
  ],
  authors: [{ name: "Club Deportivo Minvu Serviu" }],
  creator: "Club Deportivo Minvu Serviu",
  metadataBase: new URL("https://reservas.clubminvu.cl"),
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "/",
    siteName: "Reservas Club Deportivo Minvu Serviu",
    title: "Reservas Club Deportivo Minvu Serviu",
    description:
      "Reserva tu cancha deportiva de forma fácil, rápida y segura. Canchas de fútbol, tenis y gimnasio polideportivo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reservas Club Deportivo Minvu Serviu",
    description:
      "Reserva tu cancha deportiva de forma fácil, rápida y segura.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E⚽%3C/text%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
