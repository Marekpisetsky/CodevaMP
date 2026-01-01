"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

type BaseTile = {
  id: string;
  label: string;
  detail: string;
  className?: string;
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
  { id: "explorar", label: "Explorar", detail: "Toca y descubre", className: "hero-tile--ice" },
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
  { width: "clamp(110px, 12vw, 190px)", height: "clamp(70px, 8vw, 125px)", size: 0.76 },
  { width: "clamp(125px, 13vw, 205px)", height: "clamp(80px, 9vw, 135px)", size: 0.82 },
  { width: "clamp(140px, 14vw, 220px)", height: "clamp(90px, 10vw, 150px)", size: 0.88 },
  { width: "clamp(155px, 15vw, 235px)", height: "clamp(95px, 11vw, 160px)", size: 0.94 },
  { width: "clamp(100px, 11vw, 180px)", height: "clamp(65px, 7vw, 115px)", size: 0.72 },
];

const PLATE_COUNT = 90;

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
    const tilt = (seeded(i + 1) - 0.5) * 4;
    const scatterX = (seeded(i + 13) - 0.5) * 14;
    const scatterY = (seeded(i + 37) - 0.5) * 14;
    const wobbleSeed = seeded(i + 71) * Math.PI * 2;

    plates.push({
      ...base,
      id: `${base.id}-${i}`,
      size: sizePreset.size,
      width: sizePreset.width,
      height: sizePreset.height,
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

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFirefox = /firefox/i.test(navigator.userAgent);

    let rafId = 0;
    let rect = field.getBoundingClientRect();
    let centerX = rect.width / 2;
    let centerY = rect.height / 2;
    let baseRadius = Math.min(rect.width, rect.height) * 0.38;

    const state = {
      rotX: 0.2,
      rotY: 0,
      baseRotX: 0.2,
      baseRotY: 0,
      pointerAimX: 0,
      pointerAimY: 0,
      pointerBlend: 0,
      pointerX: 0,
      pointerY: 0,
      pointerTargetX: 0,
      pointerTargetY: 0,
      fieldStrength: 0,
      pointerActive: false,
      lastTime: performance.now(),
      frame: 0,
    };

    const updateLayout = () => {
      rect = field.getBoundingClientRect();
      centerX = rect.width / 2;
      centerY = rect.height / 2;
      baseRadius = Math.min(rect.width, rect.height) * 0.38;
      field.style.setProperty("--orbit-x", `${centerX.toFixed(2)}px`);
      field.style.setProperty("--orbit-y", `${centerY.toFixed(2)}px`);
    };

    const project = (x: number, y: number, z: number) => {
      const cosY = Math.cos(state.rotY);
      const sinY = Math.sin(state.rotY);
      const cosX = Math.cos(state.rotX);
      const sinX = Math.sin(state.rotX);

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
      const cosY = Math.cos(state.rotY);
      const sinY = Math.sin(state.rotY);
      const cosX = Math.cos(state.rotX);
      const sinX = Math.sin(state.rotX);

      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      return { x: x1, y: y1, z: z2 };
    };

    const updateScene = (time: number) => {
      const dt = time - state.lastTime;
      const clampedDt = Math.min(dt, 50);
      state.lastTime = time;
      state.frame += 1;
      const frameStride = isFirefox ? 3 : 1;

      if (!prefersReducedMotion) {
        state.baseRotY += clampedDt * 0.00006;
        state.pointerBlend += ((state.pointerActive ? 1 : 0) - state.pointerBlend) * 0.08;
        const desiredRotX = state.baseRotX + state.pointerAimX * state.pointerBlend;
        const desiredRotY = state.baseRotY + state.pointerAimY * state.pointerBlend;
        state.rotX += (desiredRotX - state.rotX) * 0.08;
        state.rotY += (desiredRotY - state.rotY) * 0.08;
      }

      state.pointerX += (state.pointerTargetX - state.pointerX) * 0.12;
      state.pointerY += (state.pointerTargetY - state.pointerY) * 0.12;
      const strengthTarget = state.pointerActive ? 1 : 0;
      state.fieldStrength += (strengthTarget - state.fieldStrength) * 0.08;

      if (state.frame % frameStride !== 0) {
        rafId = window.requestAnimationFrame(updateScene);
        return;
      }

      field.style.setProperty("--pointer-x", (state.pointerAimY * 0.6 * state.pointerBlend).toFixed(3));
      field.style.setProperty("--pointer-y", (state.pointerAimX * 0.6 * state.pointerBlend).toFixed(3));

      const plates = platesRef.current;
      const repelRadius = baseRadius * 0.9;
      const maxLift = 0.35;
      const linkThreshold = 0.03;
      const waveSpan = 1.2;
      const waveSigma = 0.09;
      const wavePeriod = 9000;
      const wavePhase = (time / wavePeriod) % 1;
      const wavePhaseB = (wavePhase + 0.5) % 1;
      const envelopeA = 0.5 - 0.5 * Math.cos(Math.PI * 2 * wavePhase);
      const envelopeB = 0.5 - 0.5 * Math.cos(Math.PI * 2 * wavePhaseB);
      const waveAngleA = seeded(11) * Math.PI * 2;
      const waveAngleB = seeded(27) * Math.PI * 2;
      const waveDirAX = Math.cos(waveAngleA);
      const waveDirAY = Math.sin(waveAngleA);
      const waveDirBX = Math.cos(waveAngleB);
      const waveDirBY = Math.sin(waveAngleB);
      const phaseA = Math.sin(wavePhase * Math.PI * 2) * (waveSpan / 2);
      const phaseB = Math.sin(wavePhaseB * Math.PI * 2) * (waveSpan / 2);

      const projected = plates.map((plate, index) => {
        const base = project(plate.x, plate.y, plate.z);
        const dxBase = base.x - state.pointerX;
        const dyBase = base.y - state.pointerY;
        const dist = Math.max(1, Math.hypot(dxBase, dyBase));
        const falloff = Math.max(0, (repelRadius - dist) / repelRadius);
        const intensity = state.fieldStrength * falloff * falloff;
        const floatLift = Math.sin(time * 0.002 + plate.wobbleSeed) * 0.03 * intensity;
        const wavePosA = plate.x * waveDirAX + plate.y * waveDirAY;
        const wavePosB = plate.x * waveDirBX + plate.y * waveDirBY;
        const waveProfileA = Math.exp(-((wavePosA - phaseA) * (wavePosA - phaseA)) / waveSigma) * envelopeA;
        const waveProfileB = Math.exp(-((wavePosB - phaseB) * (wavePosB - phaseB)) / waveSigma) * envelopeB;
        const idleWave =
          (waveProfileA * 0.055 + waveProfileB * 0.055) * (1 - state.fieldStrength);
        const lift = intensity * maxLift + floatLift + idleWave;
        const scaled = project(plate.x * (1 + lift), plate.y * (1 + lift), plate.z * (1 + lift));
        return {
          ...scaled,
          plate,
          intensity,
          index,
        };
      });

      let parentByIndex: Map<number, number> | null = null;
      if (state.pointerActive && state.fieldStrength > 0.04) {
        const activeIndices = projected
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => item.intensity > linkThreshold && item.z > 0)
          .map(({ index }) => index);

        parentByIndex = new Map<number, number>();
        if (activeIndices.length > 1) {
          const visited = new Set<number>();
          visited.add(activeIndices[0]);

          while (visited.size < activeIndices.length) {
            let bestFrom = -1;
            let bestTo = -1;
            let bestDist = Infinity;

            activeIndices.forEach((fromIndex) => {
              if (!visited.has(fromIndex)) {
                return;
              }
              activeIndices.forEach((toIndex) => {
                if (visited.has(toIndex)) {
                  return;
                }
                const dist = Math.hypot(
                  projected[fromIndex].x - projected[toIndex].x,
                  projected[fromIndex].y - projected[toIndex].y
                );
                if (dist < bestDist) {
                  bestDist = dist;
                  bestFrom = fromIndex;
                  bestTo = toIndex;
                }
              });
            });

            if (bestTo === -1) {
              break;
            }
            visited.add(bestTo);
            parentByIndex.set(bestTo, bestFrom);
          }

          const rootIndex = activeIndices[0];
          if (!parentByIndex.has(rootIndex)) {
            let nearest = -1;
            let bestDist = Infinity;
            activeIndices.forEach((otherIndex) => {
              if (otherIndex === rootIndex) {
                return;
              }
              const dist = Math.hypot(
                projected[rootIndex].x - projected[otherIndex].x,
                projected[rootIndex].y - projected[otherIndex].y
              );
              if (dist < bestDist) {
                bestDist = dist;
                nearest = otherIndex;
              }
            });
            if (nearest !== -1) {
              parentByIndex.set(rootIndex, nearest);
            }
          }
        }
      }

      projected.forEach((item, index) => {
        const tile = tileRefs.current[index];
        if (!tile) {
          return;
        }

        const intensity = item.intensity;

        const opacity = 1;
        const scale = item.p * item.plate.size * (0.75 + (item.z + 1) * 0.15) * 0.6;
        const tilt = item.plate.tilt;
        const wobbleX = Math.sin(time * 0.0017 + item.plate.wobbleSeed * 1.7) * 6 * intensity;
        const wobbleY = Math.cos(time * 0.0013 + item.plate.wobbleSeed * 1.1) * 6 * intensity;
        const wobbleZ = Math.sin(time * 0.0021 + item.plate.wobbleSeed * 0.9) * 10 * intensity;
        const idleWobble =
          Math.sin(time * 0.0011 + item.plate.wobbleSeed) * 4 * (1 - state.fieldStrength);

        tile.style.opacity = opacity.toFixed(3);
        tile.style.zIndex = `${Math.round((item.z + 1) * 1000)}`;
        tile.style.setProperty("--tile-glow", intensity.toFixed(3));
        const normal = rotateNormal(item.plate.x, item.plate.y, item.plate.z);
        const yaw = Math.atan2(normal.x, normal.z);
        const pitch = -Math.asin(normal.y);
        tile.style.transform =
          `translate(-50%, -50%) translate3d(${(item.x + item.plate.scatterX).toFixed(2)}px, ` +
          `${(item.y + item.plate.scatterY).toFixed(2)}px, 0) ` +
          `rotateY(${(yaw * 57.2958).toFixed(2)}deg) rotateX(${(pitch * 57.2958).toFixed(2)}deg) ` +
          `rotateZ(${(tilt + wobbleZ + idleWobble).toFixed(2)}deg) rotateX(${wobbleX.toFixed(2)}deg) ` +
          `rotateY(${wobbleY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

        const line = lineRefs.current[index];
        const crossA = crossARefs.current[index];
        const crossB = crossBRefs.current[index];
        const label = labelRefs.current[index];
        if (line && crossA && crossB && label) {
          const isActive =
            parentByIndex !== null && intensity > linkThreshold && item.z > 0;
          let neighborIndex: number | null = null;
          if (isActive) {
            const parent = parentByIndex?.get(index);
            if (parent !== undefined) {
              neighborIndex = parent;
            }
          }
          if (neighborIndex === null) {
            line.style.opacity = "0";
            crossA.style.opacity = "0";
            crossB.style.opacity = "0";
            label.style.opacity = "0";
          } else {
            const other = projected[neighborIndex];
            const linkIntensity = Math.min(1, (item.intensity + other.intensity) * 0.6);
            const value = Math.max(0, Math.min(100, Math.round(linkIntensity * 100)));
            line.setAttribute("x1", (centerX + item.x).toFixed(1));
            line.setAttribute("y1", (centerY + item.y).toFixed(1));
            line.setAttribute("x2", (centerX + other.x).toFixed(1));
            line.setAttribute("y2", (centerY + other.y).toFixed(1));
            line.style.opacity = "1";

            const crossSize = 8;
            const crossX = centerX + item.x;
            const crossY = centerY + item.y;
            crossA.setAttribute("x1", (crossX - crossSize).toFixed(1));
            crossA.setAttribute("y1", crossY.toFixed(1));
            crossA.setAttribute("x2", (crossX + crossSize).toFixed(1));
            crossA.setAttribute("y2", crossY.toFixed(1));
            crossB.setAttribute("x1", crossX.toFixed(1));
            crossB.setAttribute("y1", (crossY - crossSize).toFixed(1));
            crossB.setAttribute("x2", crossX.toFixed(1));
            crossB.setAttribute("y2", (crossY + crossSize).toFixed(1));
            crossA.style.opacity = "1";
            crossB.style.opacity = "1";

            label.textContent = value.toString();
            label.setAttribute("x", (crossX - 16).toFixed(1));
            label.setAttribute("y", (crossY - 10).toFixed(1));
            label.style.opacity = "1";
          }
        }
      });

      if (state.frame % 3 === 0) {
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
      }

      rafId = window.requestAnimationFrame(updateScene);
    };

    const handleMove = (event: PointerEvent) => {
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      state.pointerAimX = Math.max(-0.6, Math.min(0.6, -y * 0.6));
      state.pointerAimY = Math.max(-0.6, Math.min(0.6, x * 0.9));
      state.pointerTargetX = event.clientX - rect.left - centerX;
      state.pointerTargetY = event.clientY - rect.top - centerY;
      state.pointerActive = true;
    };

    const handleEnter = (event: PointerEvent) => {
      state.pointerActive = true;
      state.pointerTargetX = event.clientX - rect.left - centerX;
      state.pointerTargetY = event.clientY - rect.top - centerY;
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      state.pointerAimX = Math.max(-0.6, Math.min(0.6, -y * 0.6));
      state.pointerAimY = Math.max(-0.6, Math.min(0.6, x * 0.9));
    };

    const handleLeave = () => {
      state.pointerActive = false;
      state.baseRotX = state.rotX;
      state.baseRotY = state.rotY;
      state.pointerTargetX = state.pointerX;
      state.pointerTargetY = state.pointerY;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        state.pointerActive = false;
        state.baseRotX = state.rotX;
        state.baseRotY = state.rotY;
        state.pointerBlend = 0;
        state.pointerTargetX = state.pointerX;
        state.pointerTargetY = state.pointerY;
      } else {
        state.lastTime = performance.now();
      }
    };

    const handleResize = () => {
      updateLayout();
    };

    updateLayout();
    rafId = window.requestAnimationFrame(updateScene);
    field.addEventListener("pointermove", handleMove);
    field.addEventListener("pointerenter", handleEnter);
    field.addEventListener("pointerleave", handleLeave);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", handleResize);

    return () => {
      field.removeEventListener("pointermove", handleMove);
      field.removeEventListener("pointerenter", handleEnter);
      field.removeEventListener("pointerleave", handleLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(rafId);
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
            }}
          >
            <span className="hero-tile__label">{plate.label}</span>
            <span className="hero-tile__detail">{plate.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
