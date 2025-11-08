import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/app/components/site-shell";
import { fetchMlbbDraftAgent } from "@shared/api/mlbb-draft-agent";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.codevamp.companion";
const APP_STORE_URL = "https://apps.apple.com/app/id0000000000";

async function getAgentVersion() {
  const envBase =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  const baseUrl = envBase ?? "http://localhost:3000";
  try {
    const agent = await fetchMlbbDraftAgent(baseUrl);
    return agent.version;
  } catch (error) {
    console.error("Failed to load MLBB draft agent version", error);
    return undefined;
  }
}

export default async function DownloadPage() {
  const latestVersion = await getAgentVersion();

  return (
    <SiteShell currentPath="/download" accent="violet">
      <header className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-10">
        <span className="inline-flex items-center rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
          App móvil oficial
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Descarga CodevaMP Companion</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          Lleva el asistente táctico de Mobile Legends y las novedades de la comunidad a tu teléfono. La app sincroniza datos con la plataforma web para que siempre tengas las builds, bans y notas estratégicas actualizadas.
        </p>
        {latestVersion ? (
          <p className="text-sm text-fuchsia-200">Versión del asistente MLBB: {latestVersion}</p>
        ) : (
          <p className="text-sm text-zinc-400">Sincronizando con el asistente MLBB…</p>
        )}
        <div className="flex flex-wrap gap-4">
          <Link
            href={PLAY_STORE_URL}
            className="group inline-flex items-center gap-3 rounded-2xl bg-zinc-950/80 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900"
          >
            <Image
              src="/globe.svg"
              alt="Play Store"
              width={24}
              height={24}
              className="opacity-80 transition group-hover:opacity-100"
            />
            Google Play
          </Link>
          <Link
            href={APP_STORE_URL}
            className="group inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-fuchsia-400/70 hover:text-white"
          >
            <Image
              src="/window.svg"
              alt="App Store"
              width={24}
              height={24}
              className="opacity-80 transition group-hover:opacity-100"
            />
            App Store
          </Link>
          <a
            href="https://expo.dev/artifacts/eas/placeholder-codevamp-companion.apk"
            className="inline-flex items-center gap-3 rounded-2xl border border-fuchsia-400/40 bg-fuchsia-400/10 px-5 py-3 text-sm font-semibold text-fuchsia-100 transition hover:border-fuchsia-300 hover:text-white"
          >
            Descargar APK firmado
          </a>
        </div>
      </header>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Instrucciones de instalación</h2>
            <p className="max-w-2xl text-sm text-zinc-300">
              Sigue estos pasos según tu plataforma preferida. Toda la información de builds y notas proviene del mismo backend que alimenta a la web.
            </p>
          </div>
          <div className="rounded-2xl border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
            Sincronización REST compartida
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <h3 className="text-lg font-semibold text-white">Android (Play Store)</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-zinc-300">
              <li>Abre el enlace de Google Play y presiona <strong>Instalar</strong>.</li>
              <li>Inicia sesión con tu cuenta CodevaMP dentro de la app.</li>
              <li>Habilita las notificaciones opcionales para parches y torneos.</li>
            </ol>
          </article>
          <article className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <h3 className="text-lg font-semibold text-white">iOS (App Store)</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-zinc-300">
              <li>Descarga la app desde la App Store y espera a que finalice la instalación.</li>
              <li>Abre CodevaMP Companion y concede acceso a internet cuando se solicite.</li>
              <li>Activa las actualizaciones automáticas para recibir mejoras sin intervención.</li>
            </ol>
          </article>
          <article className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
            <h3 className="text-lg font-semibold text-white">APK firmado (testing interno)</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-zinc-300">
              <li>Descarga el APK firmado y transfiérelo al dispositivo.</li>
              <li>Activa la instalación desde orígenes desconocidos solo para esta app.</li>
              <li>Instala el archivo y valida la versión en <strong>Configuración → Acerca de</strong>.</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Notas de sincronización</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            <h3 className="text-lg font-semibold text-white">Endpoints REST</h3>
            <p className="mt-2">
              La app móvil consulta <code>/api/mlbb-draft-agent</code> utilizando el cliente compartido `@shared/api`. Esto garantiza paridad entre las builds del sitio y las del móvil.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            <h3 className="text-lg font-semibold text-white">Actualizaciones rápidas</h3>
            <p className="mt-2">
              Cada vez que se publique un nuevo parche en la web, los usuarios móviles recibirán la versión al reiniciar la app o al arrastrar para refrescar desde el menú principal.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}