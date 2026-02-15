import type { Metadata } from "next";

export const metadata: Metadata = {
  icons: {
    icon: "/visuales/icon.svg",
    shortcut: "/visuales/icon.svg",
    apple: "/visuales/icon.svg",
  },
};

export default function VisualesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
