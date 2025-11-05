import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodevaMP — Comunidad gamer chill",
  description: "Gamer chill, retos y tutoriales. Conecta con la familia CodevaMP.",
  metadataBase: new URL("https://codevamp.com"),
  openGraph: {
    title: "CodevaMP — Comunidad gamer chill",
    description: "Únete a la familia CodevaMP.",
    url: "https://codevamp.com/links",
    type: "website",
    images: ["/og-image.svg"], // ✅ usamos la versión SVG
  },
  twitter: {
    card: "summary_large_image",
    title: "CodevaMP — Comunidad gamer chill",
    description: "Únete a la familia CodevaMP.",
    images: ["/og-image.svg"], // ✅ también SVG aquí
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
