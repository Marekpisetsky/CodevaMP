"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import DevSurfaceStage from "@/app/dev/dev-surface-stage";

type Metrics = {
  published: number;
  building: number;
  ideas: number;
};

type BannerLabProps = {
  isEs: boolean;
  metrics: Metrics;
  kicker: string;
  initialTitle: string;
  initialSubtitle: string;
  children?: ReactNode;
};

type BannerMode = "easy" | "pro";

type BannerTheme = {
  title: string;
  subtitle: string;
  accent: string;
  secondary: string;
  glow: number;
  radius: number;
  showGrid: boolean;
  animate: boolean;
};

const DEFAULT_THEME: BannerTheme = {
  title: "Dev Canvas",
  subtitle: "Prototipa interfaces, ajusta estilo y publica cuando se vea perfecto.",
  accent: "#22c55e",
  secondary: "#22d3ee",
  glow: 42,
  radius: 20,
  showGrid: true,
  animate: true,
};
const STORAGE_KEY = "codevamp.dev.banner-lab.preferences.v1";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function tryParseTheme(raw: string): BannerTheme | null {
  try {
    const parsed = JSON.parse(raw) as Partial<BannerTheme>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.title !== "string" || typeof parsed.subtitle !== "string") return null;
    if (typeof parsed.accent !== "string" || typeof parsed.secondary !== "string") return null;
    if (typeof parsed.glow !== "number" || typeof parsed.radius !== "number") return null;
    if (typeof parsed.showGrid !== "boolean" || typeof parsed.animate !== "boolean") return null;
    return {
      title: parsed.title,
      subtitle: parsed.subtitle,
      accent: parsed.accent,
      secondary: parsed.secondary,
      glow: clamp(parsed.glow, 0, 100),
      radius: clamp(parsed.radius, 8, 36),
      showGrid: parsed.showGrid,
      animate: parsed.animate,
    };
  } catch {
    return null;
  }
}

function randomHex() {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  return `#${hex}`;
}

export default function BannerLab({ isEs, metrics, kicker, initialTitle, initialSubtitle, children }: BannerLabProps) {
  const initialTheme = useMemo<BannerTheme>(
    () => ({
      ...DEFAULT_THEME,
      title: initialTitle,
      subtitle: initialSubtitle,
    }),
    [initialSubtitle, initialTitle]
  );
  const [mode, setMode] = useState<BannerMode>("easy");
  const [theme, setTheme] = useState<BannerTheme>(initialTheme);
  const [themeCode, setThemeCode] = useState(JSON.stringify(initialTheme, null, 2));
  const [cssCode, setCssCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ x: 50, y: 24 });
  const [showControls, setShowControls] = useState(false);
  const [themeResolved, setThemeResolved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { theme?: unknown; cssCode?: unknown; mode?: unknown };
        if (parsed.theme) {
          const parsedTheme = tryParseTheme(JSON.stringify(parsed.theme));
          if (parsedTheme) {
            setTheme(parsedTheme);
            setThemeCode(JSON.stringify(parsedTheme, null, 2));
          }
        }
        if (typeof parsed.cssCode === "string") {
          setCssCode(parsed.cssCode);
        }
        if (parsed.mode === "easy" || parsed.mode === "pro") {
          setMode(parsed.mode);
        }
      } catch {
        // ignore invalid stored payload
      }
    }
    const complete = window.requestAnimationFrame(() => setThemeResolved(true));
    return () => window.cancelAnimationFrame(complete);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme,
        cssCode,
        mode,
      })
    );
  }, [cssCode, mode, theme]);

  const copy = useMemo(
    () => ({
      title: isEs ? "Banner Lab" : "Banner Lab",
      subtitle: isEs ? "Ajustes visuales en vivo." : "Live visual controls.",
      openControls: isEs ? "Ajustar banner" : "Adjust banner",
      closeControls: isEs ? "Ocultar ajustes" : "Hide controls",
      easy: isEs ? "Facil" : "Easy",
      pro: "Pro",
      content: isEs ? "Contenido" : "Content",
      colors: isEs ? "Colores" : "Colors",
      effects: isEs ? "Efectos" : "Effects",
      titleInput: isEs ? "Titulo" : "Title",
      subtitleInput: isEs ? "Subtitulo" : "Subtitle",
      accent: isEs ? "Acento principal" : "Primary accent",
      secondary: isEs ? "Acento secundario" : "Secondary accent",
      glow: isEs ? "Intensidad glow" : "Glow intensity",
      radius: isEs ? "Borde redondeado" : "Corner radius",
      grid: isEs ? "Mostrar grid" : "Show grid",
      animate: isEs ? "Animar fondo" : "Animate background",
      apply: isEs ? "Aplicar codigo" : "Apply code",
      random: isEs ? "Estilo sorpresa" : "Random style",
      reset: isEs ? "Reset" : "Reset",
      copyCode: isEs ? "Copiar config" : "Copy config",
      invalid: isEs ? "JSON invalido. Corrige el formato." : "Invalid JSON. Fix format.",
      proHint: isEs ? "Modo Pro: edita JSON del tema y CSS avanzado." : "Pro mode: edit theme JSON and advanced CSS.",
      jsonTheme: isEs ? "Tema (JSON)" : "Theme (JSON)",
      cssExtra: isEs ? "CSS extra" : "Extra CSS",
      kpiPublished: isEs ? "Publicados" : "Published",
      kpiBuilding: isEs ? "Construyendo" : "Building",
      kpiIdeas: isEs ? "Ideas" : "Ideas",
    }),
    [isEs]
  );

  const previewStyle = {
    "--lab-accent": theme.accent,
    "--lab-secondary": theme.secondary,
    "--lab-radius": `${theme.radius}px`,
    "--lab-glow": `${theme.glow / 100}`,
    "--lab-cursor-x": `${cursor.x}%`,
    "--lab-cursor-y": `${cursor.y}%`,
  } as CSSProperties;

  const applyPro = () => {
    const parsed = tryParseTheme(themeCode);
    if (!parsed) {
      setCodeError(copy.invalid);
      return;
    }
    setCodeError(null);
    setTheme(parsed);
  };

  const randomize = () => {
    const next = {
      ...theme,
      accent: randomHex(),
      secondary: randomHex(),
      glow: clamp(Math.floor(Math.random() * 90) + 10, 10, 100),
    };
    setTheme(next);
    setThemeCode(JSON.stringify(next, null, 2));
  };

  const reset = () => {
    const next = { ...DEFAULT_THEME, title: initialTitle, subtitle: initialSubtitle };
    setTheme(next);
    setThemeCode(JSON.stringify(next, null, 2));
    setCssCode("");
    setCodeError(null);
  };

  const copyConfig = async () => {
    await navigator.clipboard.writeText(`${themeCode}\n\n/* extra css */\n${cssCode}`);
  };

  return (
    <section className="dev-banner-lab" aria-label="Dev banner lab">
      <style>{cssCode}</style>
      <div className={`dev-banner-lab__preview${theme.animate ? " is-animated" : ""}${theme.showGrid ? " has-grid" : ""}${themeResolved ? " is-resolved" : " is-resolving-theme"}`} style={previewStyle}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - box.left) / box.width) * 100;
          const y = ((event.clientY - box.top) / box.height) * 100;
          setCursor({ x: clamp(x, 0, 100), y: clamp(y, 0, 100) });
        }}
      >
        <DevSurfaceStage animated={theme.animate} />
        <div className="dev-banner-lab__spark" />
        <button type="button" className="dev-banner-lab__toggle" onClick={() => setShowControls((prev) => !prev)}>
          {showControls ? copy.closeControls : copy.openControls}
        </button>
        <p className="dev-banner-lab__kicker">{kicker}</p>
        <h2>{theme.title}</h2>
        <p>{theme.subtitle}</p>
        {children ? <div className="dev-banner-lab__hero-actions">{children}</div> : null}
        <div className="dev-banner-lab__metrics">
          <span>{copy.kpiPublished}: {metrics.published}</span>
          <span>{copy.kpiBuilding}: {metrics.building}</span>
          <span>{copy.kpiIdeas}: {metrics.ideas}</span>
        </div>
      </div>
      {showControls ? (
        <div className="dev-banner-lab__overlay" onClick={() => setShowControls(false)}>
          <div
            className="dev-banner-lab__panel"
            aria-label={copy.title}
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h3>{copy.title}</h3>
              <button
                type="button"
                className="dev-banner-lab__panel-close"
                onClick={() => setShowControls(false)}
                aria-label={copy.closeControls}
              >
                {copy.closeControls}
              </button>
            </header>
            <div className="dev-banner-lab__modes">
              <button type="button" className={mode === "easy" ? "is-active" : ""} onClick={() => setMode("easy")}>
                {copy.easy}
              </button>
              <button type="button" className={mode === "pro" ? "is-active" : ""} onClick={() => setMode("pro")}>
                {copy.pro}
              </button>
            </div>

            {mode === "easy" ? (
              <div className="dev-banner-lab__form">
                <p className="dev-banner-lab__label">{copy.content}</p>
                <input
                  type="text"
                  value={theme.title}
                  placeholder={copy.titleInput}
                  onChange={(event) => {
                    const next = { ...theme, title: event.target.value };
                    setTheme(next);
                    setThemeCode(JSON.stringify(next, null, 2));
                  }}
                />
                <input
                  type="text"
                  value={theme.subtitle}
                  placeholder={copy.subtitleInput}
                  onChange={(event) => {
                    const next = { ...theme, subtitle: event.target.value };
                    setTheme(next);
                    setThemeCode(JSON.stringify(next, null, 2));
                  }}
                />

                <p className="dev-banner-lab__label">{copy.colors}</p>
                <div className="dev-banner-lab__row">
                  <label>
                    {copy.accent}
                    <input
                      type="color"
                      value={theme.accent}
                      onChange={(event) => {
                        const next = { ...theme, accent: event.target.value };
                        setTheme(next);
                        setThemeCode(JSON.stringify(next, null, 2));
                      }}
                    />
                  </label>
                  <label>
                    {copy.secondary}
                    <input
                      type="color"
                      value={theme.secondary}
                      onChange={(event) => {
                        const next = { ...theme, secondary: event.target.value };
                        setTheme(next);
                        setThemeCode(JSON.stringify(next, null, 2));
                      }}
                    />
                  </label>
                </div>

                <p className="dev-banner-lab__label">{copy.effects}</p>
                <label>
                  {copy.glow}: {theme.glow}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={theme.glow}
                    onChange={(event) => {
                      const next = { ...theme, glow: Number(event.target.value) };
                      setTheme(next);
                      setThemeCode(JSON.stringify(next, null, 2));
                    }}
                  />
                </label>
                <label>
                  {copy.radius}: {theme.radius}px
                  <input
                    type="range"
                    min={8}
                    max={36}
                    value={theme.radius}
                    onChange={(event) => {
                      const next = { ...theme, radius: Number(event.target.value) };
                      setTheme(next);
                      setThemeCode(JSON.stringify(next, null, 2));
                    }}
                  />
                </label>
                <div className="dev-banner-lab__row dev-banner-lab__row--toggles">
                  <label>
                    <input
                      type="checkbox"
                      checked={theme.showGrid}
                      onChange={(event) => {
                        const next = { ...theme, showGrid: event.target.checked };
                        setTheme(next);
                        setThemeCode(JSON.stringify(next, null, 2));
                      }}
                    />
                    {copy.grid}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={theme.animate}
                      onChange={(event) => {
                        const next = { ...theme, animate: event.target.checked };
                        setTheme(next);
                        setThemeCode(JSON.stringify(next, null, 2));
                      }}
                    />
                    {copy.animate}
                  </label>
                </div>
              </div>
            ) : (
              <div className="dev-banner-lab__pro">
                <p className="dev-banner-lab__hint">{copy.proHint}</p>
                <label htmlFor="banner-lab-theme">{copy.jsonTheme}</label>
                <textarea
                  id="banner-lab-theme"
                  value={themeCode}
                  spellCheck={false}
                  onChange={(event) => setThemeCode(event.target.value)}
                />
                <label htmlFor="banner-lab-css">{copy.cssExtra}</label>
                <textarea
                  id="banner-lab-css"
                  value={cssCode}
                  spellCheck={false}
                  onChange={(event) => setCssCode(event.target.value)}
                />
                {codeError ? <p className="dev-msg dev-msg--error">{codeError}</p> : null}
              </div>
            )}

            <div className="dev-banner-lab__actions">
              {mode === "pro" ? (
                <button type="button" className="dev-action-secondary" onClick={applyPro}>
                  {copy.apply}
                </button>
              ) : null}
              <button type="button" className="dev-action-secondary" onClick={randomize}>
                {copy.random}
              </button>
              <button type="button" className="dev-action-secondary" onClick={reset}>
                {copy.reset}
              </button>
              <button type="button" className="dev-action-secondary" onClick={() => void copyConfig()}>
                {copy.copyCode}
              </button>
              <button type="button" className="dev-action-secondary" onClick={() => setShowControls(false)}>
                {copy.closeControls}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
