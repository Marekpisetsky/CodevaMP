"use client"

import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import SiteShell from "../components/site-shell";
import VisualesSphereIntro from "../components/visuales-sphere-intro";

const visualesHighlights = [
  {
    title: "Celestial pop",
    detail: "Paisajes de color saturado con brillo orbital, halos y destellos suaves.",
  },
  {
    title: "Kawaii fantastico",
    detail: "Formas amables, ritmos juguetones y detalles que invitan a tocar.",
  },
  {
    title: "Anti-realismo japones",
    detail: "Reglas propias, gravedad flexible y narrativa sensorial.",
  },
];

const visualesFragments = [
  { x: "8%", y: "18%", s: "22px", r: "-18deg" },
  { x: "18%", y: "62%", s: "14px", r: "24deg" },
  { x: "28%", y: "32%", s: "12px", r: "-32deg" },
  { x: "64%", y: "22%", s: "18px", r: "12deg" },
  { x: "72%", y: "46%", s: "10px", r: "-20deg" },
  { x: "84%", y: "28%", s: "16px", r: "32deg" },
  { x: "78%", y: "68%", s: "20px", r: "-12deg" },
  { x: "40%", y: "76%", s: "12px", r: "18deg" },
];

export default function VisualesPage() {
  const [playEnter, setPlayEnter] = useState(false);
  const [sphereActive, setSphereActive] = useState(false);
  const [introDebug, setIntroDebug] = useState(false);
  const [sphereDuration, setSphereDuration] = useState(5000);
  const [introHold, setIntroHold] = useState(false);
  const [usedSphereIntro, setUsedSphereIntro] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const key = "visuales-enter-from-home";
    let shouldIntro = false;
    let forceIntro = false;
    let holdIntro = false;
    try {
      forceIntro = window.location.search.includes("intro=1");
      holdIntro = window.location.search.includes("hold=1");
      const cameFromHome = sessionStorage.getItem(key) === "1";
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
      }
      shouldIntro = forceIntro || cameFromHome;
    } catch {
      shouldIntro = false;
    }
    if (forceIntro) {
      shouldIntro = true;
      setIntroDebug(true);
      setSphereActive(true);
      setUsedSphereIntro(true);
    }
    if (holdIntro) {
      setIntroHold(true);
      setSphereDuration(20000);
    }
    if (!shouldIntro) {
      return;
    }
    if (typeof document !== "undefined") {
      const existing = document.getElementById("visuales-preoverlay");
      if (!existing) {
        const el = document.createElement("div");
        el.id = "visuales-preoverlay";
        el.className = "visuales-preoverlay";
        document.body.appendChild(el);
        window.setTimeout(() => {
          el.classList.add("visuales-preoverlay--fade");
          window.setTimeout(() => {
            el.remove();
          }, 600);
        }, 1200);
      }
    }
    setUsedSphereIntro(true);
    let didStart = false;
    let fallbackTimer = 0;
    const startIntro = () => {
      if (didStart) {
        return;
      }
      didStart = true;
      window.clearTimeout(fallbackTimer);
      if (window.location.search.includes("intro=1")) {
        window.history.replaceState({}, "", "/visuales");
      }
      setSphereActive(true);
    };
    fallbackTimer = window.setTimeout(startIntro, 500);
    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (!sphereActive || introHold) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setSphereActive(false);
      if (!usedSphereIntro) {
        setPlayEnter(true);
      }
    }, sphereDuration + 1000);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [sphereActive, sphereDuration, introHold, usedSphereIntro]);

  const handleSphereComplete = () => {
    setSphereActive(false);
    setPlayEnter(true);
  };

  const shouldPlayEnter = playEnter && !usedSphereIntro;
  const shellClassName = [shouldPlayEnter ? "visuales-enter" : "", sphereActive ? "visuales-sphere-active" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <SiteShell currentPath="/visuales" disableEffects className={shellClassName}>
      <VisualesSphereIntro
        active={sphereActive}
        onComplete={handleSphereComplete}
        durationMs={sphereDuration}
        debug={introDebug}
      />
      <section
        className={`visuales-hero ${shouldPlayEnter ? "visuales-hero--enter" : ""}`}
        aria-labelledby="visuales-title"
      >
        <div className="visuales-space" aria-hidden />
        <div className="visuales-sun" aria-hidden />
        <div className="visuales-planet" aria-hidden />
        <div className="visuales-sky" aria-hidden />
        <div className="visuales-orbit" aria-hidden />
        <div className="visuales-glow" aria-hidden />
        <div className="visuales-atmosphere" aria-hidden />
        <div className="visuales-fragments" aria-hidden>
          {visualesFragments.map((fragment, index) => (
            <span
              key={`visuales-fragment-${index}`}
              className="visuales-fragment"
              style={
                {
                  "--fx": fragment.x,
                  "--fy": fragment.y,
                  "--fs": fragment.s,
                  "--fr": fragment.r,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="visuales-content">
          <p className="visuales-eyebrow">CodevaMP Visuales</p>
          <h1 id="visuales-title" className="visuales-title">
            Una submarca nacida para explorar fantasia celestial, color extremo y narrativas pop.
          </h1>
          <p className="visuales-sub">
            Visuales es un universo donde la luz y el ritmo son lenguaje. Creamos escenas que se comportan como
            portales: todo vibra, todo responde, todo invita a perderse por un instante.
          </p>
          <div className="visuales-actions">
            <Link href="/" className="visuales-button visuales-button--primary">
              Volver al estudio
            </Link>
            <Link href="/visuales/app" className="visuales-button visuales-button--ghost">
              Explorar proyectos
            </Link>
          </div>
        </div>
      </section>

      <section className="visuales-panel" aria-label="Claves visuales">
        <div className="visuales-panel__inner">
          {visualesHighlights.map((item) => (
            <div key={item.title} className="visuales-card">
              <h2>{item.title}</h2>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
