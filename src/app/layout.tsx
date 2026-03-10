import type { Metadata, Viewport } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { getBrandConfig } from "@/brands";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  preload: false,
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const rootBrand = getBrandConfig("codevamp");

export const metadata: Metadata = {
  title: `${rootBrand.name} - ${rootBrand.tagline}`,
  description: rootBrand.description,
  metadataBase: new URL("https://codevamp.studio"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `${rootBrand.name} - ${rootBrand.tagline}`,
    description:
      "Explora proyectos experimentales, interfaces vivas y colecciones curadas por el estudio.",
    url: "https://codevamp.studio",
    type: "website",
    images: ["/og-image.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${rootBrand.name} - ${rootBrand.tagline}`,
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
  colorScheme: "dark",
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
