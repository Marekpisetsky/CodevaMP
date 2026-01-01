"use client";

import Link from "next/link";

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
  void items;
  void activePath;
  return (
    <div className="flex items-center gap-3 text-lg font-semibold text-white">
      <Link href="/" prefetch className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 text-slate-100">
          CV
        </span>
        <div>
          <span className="block text-sm uppercase tracking-[0.3em] text-slate-200">CodevaMP Studio</span>
          <span className="text-xs text-slate-300">Laboratorio de sistemas interactivos</span>
        </div>
      </Link>
    </div>
  );
}
