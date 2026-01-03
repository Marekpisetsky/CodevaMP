"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

type BaseTile = {
  id: string;
  label: string;
  detail: string;
  className?: string;
  sizeBoost?: number;
  offsetX?: number;
  offsetY?: number;
};

type Plate = BaseTile & {
  size: number;
  width: string;
  height: string;
  tilt: number;
  scatterX: number;
  scatterY: number;
  wobbleSeed: number;
  x: number;
  y: number;
  z: number;
};

const BASE_TILES: BaseTile[] = [
  { id: "lab", label: "Laboratorio", detail: "Entradas vivas", className: "hero-tile--core hero-tile--signal" },
  {
    id: "explorar",
    label: "Explorar",
    detail: "Sosten para explorar",
    className: "hero-tile--ice hero-tile--focus",
    sizeBoost: 1.12,
    offsetX: -12,
    offsetY: -8,
  },
  { id: "audio", label: "Audio", detail: "Ritmos sensoriales", className: "hero-tile--glass hero-tile--oxide" },
  { id: "prototipos", label: "Prototipos", detail: "Juego y prueba", className: "hero-tile--teal" },
  { id: "mapa", label: "Mapa vivo", detail: "Capas que mutan", className: "hero-tile--pulse hero-tile--amber" },
  { id: "archivo", label: "Archivo", detail: "Colecciones abiertas", className: "hero-tile--hollow hero-tile--chalk" },
  { id: "vision", label: "Vision", detail: "Narrativas en capas", className: "hero-tile--rose" },
  { id: "visuales", label: "Visuales", detail: "Escenas moduladas", className: "hero-tile--glass hero-tile--steel" },
  { id: "comunidad", label: "Comunidad", detail: "Puertas abiertas", className: "hero-tile--jade" },
  { id: "energia", label: "Energia", detail: "Ritmo continuo", className: "hero-tile--glow hero-tile--neon" },
];

const SIZE_PRESETS = [
  { width: "clamp(90px, 11vw, 175px)", height: "clamp(60px, 7vw, 115px)", size: 0.7 },
  { width: "clamp(105px, 12vw, 190px)", height: "clamp(70px, 8vw, 125px)", size: 0.76 },
  { width: "clamp(120px, 13vw, 205px)", height: "clamp(80px, 9vw, 140px)", size: 0.82 },
  { width: "clamp(135px, 14vw, 220px)", height: "clamp(85px, 10vw, 150px)", size: 0.88 },
  { width: "clamp(80px, 10vw, 165px)", height: "clamp(55px, 6vw, 105px)", size: 0.66 },
];

const PLATE_COUNT = 90;
const HOLD_DURATION = 1100;

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const createPlates = () => {
  const plates: Plate[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < PLATE_COUNT; i += 1) {
    const t = (i + 0.5) / PLATE_COUNT;
    const phi = Math.acos(1 - 2 * t);
    const theta = golden * i;
    const x = Math.cos(theta) * Math.sin(phi);
    const y = Math.cos(phi);
    const z = Math.sin(theta) * Math.sin(phi);

    const base = BASE_TILES[i % BASE_TILES.length];
    const sizePreset = SIZE_PRESETS[i % SIZE_PRESETS.length];
    const sizeBoost = base.sizeBoost ?? 1;
    const tilt = (seeded(i + 1) - 0.5) * 4;
    const scatterX = (seeded(i + 13) - 0.5) * 14 + (base.offsetX ?? 0);
    const scatterY = (seeded(i + 37) - 0.5) * 14 + (base.offsetY ?? 0);
    const wobbleSeed = seeded(i + 71) * Math.PI * 2;

    plates.push({
      ...base,
      id: `${base.id}-${i}`,
      size: sizePreset.size * sizeBoost,
      width: sizeBoost === 1 ? sizePreset.width : `calc(${sizePreset.width} * ${sizeBoost})`,
      height: sizeBoost === 1 ? sizePreset.height : `calc(${sizePreset.height} * ${sizeBoost})`,
      tilt,
      scatterX,
      scatterY,
      wobbleSeed,
      x,
      y,
      z,
    });
  }

  return plates;
};

const createWireRings = () => {
  const rings: Array<Array<[number, number, number]>> = [];
  const latCount = 6;
  const lonCount = 10;
  const steps = 40;

  for (let i = 1; i <= latCount; i += 1) {
    const phi = (i / (latCount + 1) - 0.5) * Math.PI;
    const ring: Array<[number, number, number]> = [];
    for (let j = 0; j <= steps; j += 1) {
      const theta = (j / steps) * Math.PI * 2;
      ring.push([Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi)]);
    }
    rings.push(ring);
  }

  for (let i = 0; i < lonCount; i += 1) {
    const theta = (i / lonCount) * Math.PI * 2;
    const ring: Array<[number, number, number]> = [];
    for (let j = 0; j <= steps; j += 1) {
      const phi = (j / steps - 0.5) * Math.PI;
      ring.push([Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi)]);
    }
    rings.push(ring);
  }

  return rings;
};

export default function ForestScene() {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);
  const crossARefs = useRef<Array<SVGLineElement | null>>([]);
  const crossBRefs = useRef<Array<SVGLineElement | null>>([]);
  const labelRefs = useRef<Array<SVGTextElement | null>>([]);
  const wireRefs = useRef<Array<SVGPathElement | null>>([]);
  const holdFrames = useRef<Map<number, number>>(new Map());
  const platesRef = useRef<Plate[]>([]);
  const ringsRef = useRef<Array<Array<[number, number, number]>>>([]);

  if (platesRef.current.length === 0) {
    platesRef.current = createPlates();
  }
  if (ringsRef.current.length === 0) {
    ringsRef.current = createWireRings();
  }

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) {
      return;
    }

    let rect = field.getBoundingClientRect();
    let centerX = rect.width / 2;
    let centerY = rect.height / 2;
    let baseRadius = Math.min(rect.width, rect.height) * 0.38;
    const rotX = 0.2;
    const rotY = 0;

    const updateLayout = () => {
      rect = field.getBoundingClientRect();
      centerX = rect.width / 2;
      centerY = rect.height / 2;
      baseRadius = Math.min(rect.width, rect.height) * 0.38;
      field.style.setProperty("--orbit-x", `${centerX.toFixed(2)}px`);
      field.style.setProperty("--orbit-y", `${centerY.toFixed(2)}px`);
    };

    const project = (x: number, y: number, z: number) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const focal = 2.4;
      const perspective = focal / (focal - z2);

      return {
        x: x1 * baseRadius * perspective,
        y: y1 * baseRadius * perspective,
        z: z2,
        p: perspective,
      };
    };

    const rotateNormal = (x: number, y: number, z: number) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      return { x: x1, y: y1, z: z2 };
    };

    const renderStatic = () => {
      updateLayout();
      const plates = platesRef.current;
      const minViewport = Math.min(rect.width, rect.height);
      const responsiveScale = Math.min(1, Math.max(0.45, minViewport / 900));

      const projected = plates.map((plate) => {
        const base = project(plate.x, plate.y, plate.z);
        return { ...base, plate };
      });

      projected.forEach((item, index) => {
        const tile = tileRefs.current[index];
        if (!tile) {
          return;
        }

        const isHolding = field.classList.contains("is-holding");
        const isHoldingTile = tile.classList.contains("is-holding");
        const opacity = isHolding && !isHoldingTile ? 0.3 : 1;
        const holdScale = isHoldingTile ? 0.98 : 1;
        const scale =
          item.p * item.plate.size * (0.75 + (item.z + 1) * 0.15) * 0.55 * responsiveScale * holdScale;
        const tilt = item.plate.tilt;
        tile.style.opacity = opacity.toFixed(3);
        tile.style.zIndex = `${Math.round((item.z + 1) * 1000)}`;
        tile.style.setProperty("--tile-glow", "0");
        const normal = rotateNormal(item.plate.x, item.plate.y, item.plate.z);
        const yaw = Math.atan2(normal.x, normal.z);
        const pitch = -Math.asin(normal.y);
        tile.style.transform =
          `translate(-50%, -50%) translate3d(${(item.x + item.plate.scatterX).toFixed(2)}px, ` +
          `${(item.y + item.plate.scatterY).toFixed(2)}px, 0) ` +
          `rotateY(${(yaw * 57.2958).toFixed(2)}deg) rotateX(${(pitch * 57.2958).toFixed(2)}deg) ` +
          `rotateZ(${tilt.toFixed(2)}deg) scale(calc(${scale.toFixed(3)} * var(--hover-scale, 1)))`;

        const line = lineRefs.current[index];
        const crossA = crossARefs.current[index];
        const crossB = crossBRefs.current[index];
        const label = labelRefs.current[index];
        if (line && crossA && crossB && label) {
          line.style.opacity = "0";
          crossA.style.opacity = "0";
          crossB.style.opacity = "0";
          label.style.opacity = "0";
        }
      });

      ringsRef.current.forEach((ring, ringIndex) => {
        const path = wireRefs.current[ringIndex];
        if (!path) {
          return;
        }
        let d = "";
        ring.forEach((point, pointIndex) => {
          const proj = project(point[0], point[1], point[2]);
          const px = centerX + proj.x;
          const py = centerY + proj.y;
          d += `${pointIndex === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)} `;
        });
        path.setAttribute("d", d.trim());
      });
    };

    renderStatic();
    window.addEventListener("resize", renderStatic);

    return () => {
      window.removeEventListener("resize", renderStatic);
    };
  }, []);

  const plates = platesRef.current;
  const rings = ringsRef.current;

  return (
    <div className="forest-canvas">
      <div ref={fieldRef} className="hero-field" role="presentation">
        <svg className="hero-wireframe" aria-hidden>
          <g>
            {rings.map((_, index) => (
              <path
                key={`ring-${index}`}
                ref={(node) => {
                  wireRefs.current[index] = node;
                }}
              />
            ))}
          </g>
        </svg>

        <svg className="hero-links" aria-hidden>
          <g className="hero-force">
            {plates.map((plate, index) => (
              <g key={`link-${plate.id}`}>
                <line
                  className="hero-link-line"
                  ref={(node) => {
                    lineRefs.current[index] = node;
                  }}
                />
                <line
                  className="hero-link-cross"
                  ref={(node) => {
                    crossARefs.current[index] = node;
                  }}
                />
                <line
                  className="hero-link-cross"
                  ref={(node) => {
                    crossBRefs.current[index] = node;
                  }}
                />
                <text
                  ref={(node) => {
                    labelRefs.current[index] = node;
                  }}
                />
              </g>
            ))}
          </g>
        </svg>

        {plates.map((plate, index) => (
          <button
            key={plate.id}
            type="button"
            className={`hero-tile ${plate.className ?? ""}`}
            style={
              {
                "--tile-w": plate.width,
                "--tile-h": plate.height,
              } as CSSProperties
            }
            aria-label={`${plate.label}. ${plate.detail}`}
            ref={(node) => {
              tileRefs.current[index] = node;
            }}
            onPointerLeave={(event) => {
              const target = event.currentTarget;
              if (target.classList.contains("is-holding")) {
                target.classList.remove("is-holding");
                target.style.setProperty("--hold-progress", "0");
                fieldRef.current?.classList.remove("is-holding");
              }
              const holdFrame = holdFrames.current.get(index);
              if (holdFrame) {
                window.cancelAnimationFrame(holdFrame);
                holdFrames.current.delete(index);
              }
            }}
            onPointerDown={(event) => {
              const target = event.currentTarget;
              const rect = target.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * 100;
              const y = ((event.clientY - rect.top) / rect.height) * 100;
              target.style.setProperty("--ripple-x", `${x.toFixed(2)}%`);
              target.style.setProperty("--ripple-y", `${y.toFixed(2)}%`);
              target.classList.remove("is-rippling");
              void target.offsetWidth;
              target.classList.add("is-rippling");

              if (target.classList.contains("hero-tile--focus")) {
                const start = performance.now();
                target.classList.add("is-holding");
                fieldRef.current?.classList.add("is-holding");
                target.style.setProperty("--hold-progress", "0");

                const tick = (now: number) => {
                  const progress = Math.min(1, (now - start) / HOLD_DURATION);
                  target.style.setProperty("--hold-progress", progress.toFixed(3));
                  if (progress < 1 && target.classList.contains("is-holding")) {
                    const frame = window.requestAnimationFrame(tick);
                    holdFrames.current.set(index, frame);
                  }
                };

                const frame = window.requestAnimationFrame(tick);
                holdFrames.current.set(index, frame);
              }
            }}
            onPointerUp={(event) => {
              const target = event.currentTarget;
              if (!target.classList.contains("is-holding")) {
                return;
              }
              target.classList.remove("is-holding");
              target.style.setProperty("--hold-progress", "0");
              fieldRef.current?.classList.remove("is-holding");
              const holdFrame = holdFrames.current.get(index);
              if (holdFrame) {
                window.cancelAnimationFrame(holdFrame);
                holdFrames.current.delete(index);
              }
            }}
            onPointerCancel={(event) => {
              const target = event.currentTarget;
              if (!target.classList.contains("is-holding")) {
                return;
              }
              target.classList.remove("is-holding");
              target.style.setProperty("--hold-progress", "0");
              fieldRef.current?.classList.remove("is-holding");
              const holdFrame = holdFrames.current.get(index);
              if (holdFrame) {
                window.cancelAnimationFrame(holdFrame);
                holdFrames.current.delete(index);
              }
            }}
          >
            <span className="hero-tile__label">{plate.label}</span>
            <span className="hero-tile__detail">{plate.detail}</span>
            <span className="hero-tile__progress" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
