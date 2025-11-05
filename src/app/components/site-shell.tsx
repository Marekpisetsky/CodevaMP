import type { ReactNode } from "react";
import Navigation, { type NavItem } from "./navigation";

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/acerca", label: "Acerca" },
  { href: "/juegos", label: "Juegos" },
  { href: "/juegos#mlbb", label: "MLBB" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/donaciones", label: "Donaciones" },
  { href: "/legal", label: "Legal" },
];

export default function SiteShell({
  children,
  currentPath,
  accent,
}: {
  children: ReactNode;
  currentPath?: string;
  accent?: "indigo" | "violet" | "emerald" | "amber";
}) {
  const accentMap = {
    indigo: "from-indigo-500 to-cyan-500",
    violet: "from-fuchsia-500 to-purple-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-400 to-orange-500",
  } as const;

  const accentClass = accent ? accentMap[accent] : accentMap.indigo;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050513] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-1/3 top-1/4 h-80 w-80 rounded-full bg-purple-500 blur-[120px]" />
        <div className={`absolute right-0 top-0 h-72 w-72 rounded-full bg-gradient-to-br ${accentClass} blur-[140px]`} />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <Navigation items={NAV_ITEMS} activePath={currentPath} />
        <div className="mt-8 flex-1 pb-16">
          {children}
        </div>
      </div>
    </main>
  );
}
