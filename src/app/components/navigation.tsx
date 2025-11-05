"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
  prefetch?: boolean;
};

export default function Navigation({
  items,
  activePath,
}: {
  items: NavItem[];
  activePath?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    items.forEach((item) => {
      if (item.href.startsWith("#")) return;
      router.prefetch(item.href);
    });
  }, [items, router]);

  const current = activePath ?? pathname;

  return (
    <nav className="flex flex-wrap items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
      <Link href="/" prefetch className="flex items-center gap-3 text-lg font-semibold text-white">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg">
          CV
        </span>
        <div>
          <span className="block text-sm uppercase tracking-wide text-indigo-200">CodevaMP</span>
          <span className="text-xs text-zinc-300">Gaming Studio &amp; Comunidad</span>
        </div>
      </Link>

      <div className="hidden gap-6 text-sm font-medium text-zinc-300 md:flex">
        {items.map((item) => {
          const isActive = current === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.prefetch ?? true}
              className={`transition ${
                isActive
                  ? "text-white"
                  : "hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <Link
        href="/donaciones"
        prefetch
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02] md:mt-0"
      >
        💖 Apoya el proyecto
      </Link>
    </nav>
  );
}
