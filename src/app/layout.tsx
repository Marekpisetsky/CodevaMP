import type { Metadata, Viewport } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CodevaMP Studio - laboratorio de sistemas interactivos",
  description:
    "Universo en construccion: mini-apps, prototipos jugables, herramientas, juegos y experiencias modulares.",
  metadataBase: new URL("https://codevamp.studio"),
  openGraph: {
    title: "CodevaMP Studio - laboratorio de sistemas interactivos",
    description:
      "Explora proyectos experimentales, interfaces vivas y colecciones curadas por el estudio.",
    url: "https://codevamp.studio",
    type: "website",
    images: ["/og-image.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodevaMP Studio - laboratorio de sistemas interactivos",
    description:
      "Explora proyectos experimentales, interfaces vivas y colecciones curadas por el estudio.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
