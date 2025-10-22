export default function Page() {
  const links = [
    { href: "https://youtube.com/@CodevaMPYT", label: "YouTube", sub: "Videos, retos y directos", emoji: "▶️" },
    { href: "https://twitch.tv/codevamp", label: "Twitch", sub: "Streams chill", emoji: "🎥" },
    { href: "https://kick.com/codevamp", label: "Kick", sub: "Directos alternos", emoji: "🟢" },
    { href: "https://www.tiktok.com/@codevamp_official", label: "TikTok", sub: "Clips y highlights", emoji: "🎶" },
    { href: "https://instagram.com/codevamp_official", label: "Instagram", sub: "Arte y previews", emoji: "📸" },
    { href: "https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT", label: "Comunidad WhatsApp", sub: "Únete al chat oficial", emoji: "💬" }
  ];

  return (
    <main className="min-h-screen bg-[#0b0b12] text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/3 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,.45)]">
        <header className="flex items-center gap-4 p-6 pb-2">
          <div className="w-16 h-16 rounded-xl grid place-items-center text-white font-black text-xl
                          shadow-[0_10px_30px_rgba(139,92,246,.35)]"
               style={{background: "conic-gradient(from 210deg, #8b5cf6, #22d3ee)"}}>
            CV
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">CodevaMP</h1>
            <p className="text-zinc-400 text-sm">Gamer chill · Retos y tutoriales · Únete a la familia 💜</p>
          </div>
          <span className="hidden sm:inline-flex items-center text-xs text-black rounded-full px-3 py-1"
                style={{background: "linear-gradient(90deg,#8b5cf6,#22d3ee)"}}>
            oficial
          </span>
        </header>

        <section className="grid gap-3 p-6 pt-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer"
               className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/2 px-4 py-4
                          transition hover:-translate-y-0.5 hover:border-fuchsia-400/40">
              <span className="text-lg">{l.emoji}</span>
              <div className="flex-1">
                <div className="font-medium">{l.label}</div>
                <div className="text-xs text-zinc-400">{l.sub}</div>
              </div>
              <span className="opacity-60 group-hover:opacity-100 transition">↗</span>
            </a>
          ))}
        </section>

        <footer className="flex items-center justify-between p-6 pt-2 text-xs text-zinc-400">
          <span>© {new Date().getFullYear()} CodevaMP</span>
          <a className="hover:text-zinc-200" href="https://github.com/CodevaMP-Official" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}
