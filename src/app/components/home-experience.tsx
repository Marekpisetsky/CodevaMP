"use client";

import Link from "next/link";
import ForestScene from "./forest-scene";
import SiteShell from "./site-shell";
import { useExperienceSwarm } from "../lib/experience-swarm";

export default function HomeExperience() {
  const swarm = useExperienceSwarm();

  return (
    <SiteShell currentPath="/" disableEffects lockScroll className="home-premium-shell">
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
    </SiteShell>
  );
}
