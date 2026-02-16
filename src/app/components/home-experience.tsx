"use client";

import Link from "next/link";
import ForestScene from "./forest-scene";
import SiteShell from "./site-shell";
import { useExperienceSwarm } from "../lib/experience-swarm";

export default function HomeExperience() {
  const swarm = useExperienceSwarm();

  return (
    <SiteShell currentPath="/" disableEffects className="home-premium-shell">
      <section id="hero-section" className="scene-panel scene-panel--visual" aria-label="Escena interactiva">
        <ForestScene qualityMode={swarm.mode} routeMap={swarm.tileRouteMap} />

        <div className="home-swarm-nav" aria-label="Accesos rapidos">
          <p className="home-swarm-nav__label">Swarm Navigation</p>
          <div className="home-swarm-nav__list">
            {swarm.quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="home-swarm-nav__link">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="home-trust-shell" role="complementary" aria-label="Garantias de plataforma">
          <p className="home-trust-shell__eyebrow">AI Agent Swarm: {swarm.mode}</p>
          <h1 className="home-trust-shell__title">Experiencias interactivas premium con enfoque en confianza y seguridad.</h1>
          <ul className="home-trust-shell__list">
            {swarm.trustSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
          <Link href="/legal" className="home-trust-shell__cta">
            Ver politicas y terminos
          </Link>
        </div>
      </section>

      <section className="home-root-deck" id="intro-section" aria-label="Rutas principales de CodevaMP">
        <div className="home-root-deck__inner">
          <header className="home-root-deck__header">
            <p className="home-root-deck__kicker">CodevaMP raiz</p>
            <h2>Un solo ecosistema, multiples frentes creativos y tecnicos.</h2>
            <p>
              Debajo del planeta consolidamos las rutas clave del estudio para que la exploracion tenga continuidad y no
              termine en una sola escena.
            </p>
          </header>

          <div className="home-root-deck__grid">
            <Link href="/acerca" className="home-root-deck__card">
              <span>Acerca</span>
              <strong>Vision, principios y ritmo del estudio.</strong>
            </Link>
            <Link href="/explorar" className="home-root-deck__card">
              <span>Explorar</span>
              <strong>Mapa activo de experiencias y laboratorios.</strong>
            </Link>
            <Link href="/proyectos" className="home-root-deck__card">
              <span>Proyectos</span>
              <strong>Colecciones y convocatorias de colaboracion.</strong>
            </Link>
            <Link href="/audio" className="home-root-deck__card">
              <span>Audio</span>
              <strong>Nueva unidad para experiencias sonoras interactivas.</strong>
            </Link>
            <Link href="/donaciones" className="home-root-deck__card">
              <span>Donaciones</span>
              <strong>Modelo de apoyo para sostener desarrollo continuo.</strong>
            </Link>
            <Link href="/legal" className="home-root-deck__card">
              <span>Legal</span>
              <strong>Marco de seguridad, privacidad y cumplimiento.</strong>
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
