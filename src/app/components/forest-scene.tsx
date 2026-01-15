"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  wobbleSeed: number;
  tilt: number;
  scatterX: number;
  scatterY: number;
  baseId: string;
  isPrimary: boolean;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
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

const SIZE_PRESET = { width: "clamp(260px, 26vmin, 450px)", height: "clamp(180px, 18vmin, 320px)", size: 1.1 };
const PLATE_COUNT = 14;

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const normalizeVec = (x: number, y: number, z: number) => {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len] as [number, number, number];
};

const randomOnSphere = (seed: number) => {
  const u = seeded(seed + 11);
  const v = seeded(seed + 97);
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  const x = Math.cos(theta) * Math.sin(phi);
  const y = Math.cos(phi);
  const z = Math.sin(theta) * Math.sin(phi);
  return normalizeVec(x, y, z);
};

const generatePoints = (count: number) => {
  const points: Array<[number, number, number]> = [];
  let minDot = 0.88;
  let attempts = 0;
  while (points.length < count && attempts < 6000) {
    const point = randomOnSphere(attempts + 17);
    const ok = Math.abs(point[1]) < 0.86 && points.every((other) => {
      const dot = point[0] * other[0] + point[1] * other[1] + point[2] * other[2];
      return dot < minDot;
    });
    if (ok) {
      points.push(point);
    } else if (attempts % 800 === 0 && minDot > 0.7) {
      minDot -= 0.02;
    }
    attempts += 1;
  }
  while (points.length < count) {
    const fallback = randomOnSphere(points.length + 221);
    if (Math.abs(fallback[1]) < 0.86) {
      points.push(fallback);
    }
  }
  return points;
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

const createPlates = () => {
  const plates: Plate[] = [];
  const baseCounts: Record<string, number> = {};
  const points = generatePoints(PLATE_COUNT);
  for (let i = 0; i < PLATE_COUNT; i += 1) {
    const pos = points[i];
    const base = BASE_TILES[i % BASE_TILES.length];
    const currentCount = baseCounts[base.id] ?? 0;
    baseCounts[base.id] = currentCount + 1;

    plates.push({
      ...base,
      id: `${base.id}-${i}`,
      baseId: base.id,
      isPrimary: currentCount === 0,
      size: SIZE_PRESET.size,
      width: SIZE_PRESET.width,
      height: SIZE_PRESET.height,
      wobbleSeed: seeded(i + 71) * Math.PI * 2,
      tilt: (seeded(i + 1) - 0.5) * 4,
      scatterX: (seeded(i + 13) - 0.5) * 4,
      scatterY: (seeded(i + 37) - 0.5) * 4,
      x: pos[0],
      y: pos[1],
      z: pos[2],
      nx: pos[0],
      ny: pos[1],
      nz: pos[2],
    });
  }

  return plates;
};

export default function ForestScene() {
  const router = useRouter();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    isPointerDown: false,
    isDragging: false,
    hasCapture: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    targetRotX: 0,
    targetRotY: 0,
  });
  const wireRefs = useRef<Array<SVGPathElement | null>>([]);
  const baseSizeRef = useRef<Array<{ w: number; h: number; scale: number } | null>>([]);
  const platePoseRef = useRef<Array<{ yaw: number; pitch: number; tilt: number } | null>>([]);
  const dragMovedRef = useRef(false);
  const platesRef = useRef<Plate[]>([]);
  const ringsRef = useRef<Array<Array<[number, number, number]>>>([]);
  const [activePanel, setActivePanel] = useState<null | "vision">(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPortalArriving, setIsPortalArriving] = useState(false);
  const [isPortalDeparting, setIsPortalDeparting] = useState(false);
  const [portalOrigin, setPortalOrigin] = useState({ x: 0, y: 0 });
  const [shatterIndex, setShatterIndex] = useState<number | null>(null);
  const shatterIndexRef = useRef<number | null>(null);
  const shatterStartRef = useRef(0);
  const transitionTimeoutRef = useRef<number | null>(null);
  const transitionStartTimeoutRef = useRef<number | null>(null);
  const fragmentTimeoutRef = useRef<number | null>(null);
  const portalArriveTimeoutRef = useRef<number | null>(null);
  const portalDepartTimeoutRef = useRef<number | null>(null);
  const visionTimeoutsRef = useRef<number[]>([]);
  const activePanelRef = useRef<null | "vision">(null);
  const [isClosingVision, setIsClosingVision] = useState(false);
  const closingVisionRef = useRef(false);
  const closingAnimRef = useRef({
    active: false,
    mode: "closing" as "closing" | "handoff",
    startTime: 0,
    handoffStart: 0,
    startX: 0,
    startY: 0,
    startScale: 1,
    startYaw: 0,
    startPitch: 0,
    handoffX: 0,
    handoffY: 0,
    handoffScale: 1,
    handoffYaw: 0,
    handoffPitch: 0,
  });
  const visionPoseRef = useRef({ x: 0, y: 0, scale: 1, yaw: 0, pitch: 0 });
  const stageTimingRef = useRef<{
    stage: null | "center" | "dock" | "expandx" | "expandy";
    time: number;
  }>({
    stage: null,
    time: 0,
  });
  const [visionStage, setVisionStage] = useState<null | "center" | "dock" | "expandx" | "expandy">(null);
  const visionStageRef = useRef<null | "center" | "dock" | "expandx" | "expandy">(null);

  if (platesRef.current.length === 0) {
    platesRef.current = createPlates();
  }
  if (baseSizeRef.current.length !== platesRef.current.length) {
    baseSizeRef.current = platesRef.current.map(() => null);
  }
  if (platePoseRef.current.length !== platesRef.current.length) {
    platePoseRef.current = platesRef.current.map(() => null);
  }
  if (ringsRef.current.length === 0) {
    ringsRef.current = createWireRings();
  }

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  useEffect(() => {
    closingVisionRef.current = isClosingVision;
  }, [isClosingVision]);

  useEffect(() => {
    shatterIndexRef.current = shatterIndex;
  }, [shatterIndex]);

  useEffect(() => {
    visionStageRef.current = visionStage;
  }, [visionStage]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      if (transitionStartTimeoutRef.current !== null) {
        window.clearTimeout(transitionStartTimeoutRef.current);
      }
      if (fragmentTimeoutRef.current !== null) {
        window.clearTimeout(fragmentTimeoutRef.current);
      }
      if (portalArriveTimeoutRef.current !== null) {
        window.clearTimeout(portalArriveTimeoutRef.current);
      }
      if (portalDepartTimeoutRef.current !== null) {
        window.clearTimeout(portalDepartTimeoutRef.current);
      }
      if (visionTimeoutsRef.current.length) {
        visionTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        visionTimeoutsRef.current = [];
      }
    };
  }, []);

  const spawnVisualesFragments = (tile: HTMLButtonElement, index: number) => {
    const portal = portalRef.current;
    if (!portal) {
      return;
    }
    portal.innerHTML = "";
    const rect = tile.getBoundingClientRect();
    const fragmentCount = 36;
    const centerY = rect.top + rect.height / 2;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const triangleW = Math.min(viewW * 0.9, rect.width * 3.1);
    const triangleH = triangleW * 0.98;
    const pose = platePoseRef.current[index] ?? { yaw: 0, pitch: 0, tilt: 0 };

    const triangleVertices = [
      { x: 0, y: -triangleH * 0.58 },
      { x: -triangleW * 0.7, y: triangleH * 0.52 },
      { x: triangleW * 0.7, y: triangleH * 0.52 },
    ];

    for (let index = 0; index < fragmentCount; index += 1) {
      const fragment = document.createElement("span");
      fragment.className = "portal-fragment";
      const seed = index * 31 + 19;
      const leftSide = index < fragmentCount / 2;
      const pieceW = rect.width * (0.12 + seeded(seed + 3) * 0.22);
      const pieceH = rect.height * (0.12 + seeded(seed + 5) * 0.22);
      const localX = seeded(seed + 9) * (rect.width - pieceW);
      const localY = seeded(seed + 13) * (rect.height - pieceH);
      const startX = rect.left + localX;
      const startY = rect.top + localY;
      const ejectX = (leftSide ? -1 : 1) * (rect.width * (0.85 + seeded(seed + 2) * 0.55));
      const ejectY = (seeded(seed + 7) - 0.5) * rect.height * 0.6;
      const sideIndex = leftSide ? index : index - fragmentCount / 2;
      const edgeX = leftSide
        ? -rect.width * (0.9 + seeded(seed + 31) * 0.25)
        : viewW + rect.width * (0.9 + seeded(seed + 31) * 0.25);
      const edgeSpread =
        ((sideIndex - (fragmentCount / 2 - 1) / 2) / (fragmentCount / 2)) * viewH * 0.32;
      const edgeY = centerY + (seeded(seed + 11) - 0.5) * viewH * 0.6 + edgeSpread;
      const spin = (leftSide ? -1 : 1) * (14 + seeded(seed + 5) * 26);
      const delay = sideIndex * 0.006 + seeded(seed + 23) * 0.012;

      const randA = seeded(seed + 29);
      const randB = seeded(seed + 37);
      let u = randA;
      let v = randB;
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;
      let targetX =
        triangleVertices[0].x * w + triangleVertices[1].x * u + triangleVertices[2].x * v;
      let targetY =
        triangleVertices[0].y * w + triangleVertices[1].y * u + triangleVertices[2].y * v;
      const dist = Math.hypot(targetX, targetY);
      if (dist < triangleW * 0.18) {
        const scale = (triangleW * 0.24) / Math.max(1, dist);
        targetX *= scale;
        targetY *= scale;
      }

      const makeJaggedClip = () => {
        const points = 6;
        const coords = [];
        for (let pointIndex = 0; pointIndex < points; pointIndex += 1) {
          const angle = (Math.PI * 2 * pointIndex) / points;
          const radius = 0.35 + seeded(seed + 101 + pointIndex * 7) * 0.65;
          const x = 50 + Math.cos(angle) * radius * 50;
          const y = 50 + Math.sin(angle) * radius * 50;
          coords.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
        }
        return coords.join(", ");
      };

      fragment.style.setProperty("--start-x", `${startX}px`);
      fragment.style.setProperty("--start-y", `${startY}px`);
      fragment.style.setProperty("--spin", `${spin}deg`);
      fragment.style.setProperty("--delay", `${delay.toFixed(2)}s`);
      fragment.style.setProperty("--w", `${pieceW.toFixed(1)}px`);
      fragment.style.setProperty("--h", `${pieceH.toFixed(1)}px`);
      fragment.style.setProperty("--tx", `${targetX.toFixed(1)}px`);
      fragment.style.setProperty("--ty", `${targetY.toFixed(1)}px`);
      fragment.style.setProperty("--clip", makeJaggedClip());
      fragment.style.setProperty("--eject-x", `${ejectX.toFixed(1)}px`);
      fragment.style.setProperty("--eject-y", `${ejectY.toFixed(1)}px`);
      fragment.style.setProperty("--edge-x", `${edgeX.toFixed(1)}px`);
      fragment.style.setProperty("--edge-y", `${edgeY.toFixed(1)}px`);
      const pull = seeded(seed + 71) > 0.65 ? 1 : 0;
      fragment.style.setProperty("--pull", `${pull}`);
      const depthOut = 60 + seeded(seed + 51) * 220;
      const depthIn = 260 + seeded(seed + 59) * 420;
      fragment.style.setProperty("--z-out", `${depthOut.toFixed(1)}px`);
      fragment.style.setProperty("--z-in", `${depthIn.toFixed(1)}px`);
      fragment.style.setProperty("--glow", `${(12 + seeded(seed + 63) * 18).toFixed(1)}`);
      const stoneAlpha = (0.4 + seeded(seed + 41) * 0.35).toFixed(2);
      const grassAlpha = (0.18 + seeded(seed + 47) * 0.25).toFixed(2);
      fragment.style.setProperty("--stone", stoneAlpha);
      fragment.style.setProperty("--stone-alpha", stoneAlpha);
      fragment.style.setProperty("--grass-alpha", grassAlpha);
      fragment.style.setProperty("--pose-yaw", `${pose.yaw.toFixed(2)}deg`);
      fragment.style.setProperty("--pose-pitch", `${pose.pitch.toFixed(2)}deg`);
      fragment.style.setProperty("--pose-tilt", `${pose.tilt.toFixed(2)}deg`);

      const clone = tile.cloneNode(true) as HTMLButtonElement;
      clone.classList.add("portal-fragment__card");
      clone.style.position = "absolute";
      clone.style.left = "0";
      clone.style.top = "0";
      clone.style.margin = "0";
      clone.style.transform = `translate3d(${-localX.toFixed(1)}px, ${-localY.toFixed(1)}px, 0)`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.setProperty("--tile-w", `${rect.width}px`);
      clone.style.setProperty("--tile-h", `${rect.height}px`);
      clone.style.transition = "none";
      clone.style.pointerEvents = "none";
      clone.disabled = true;
      fragment.appendChild(clone);
      portal.appendChild(fragment);
    }
  };

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let rect = field.getBoundingClientRect();
    let centerX = rect.width / 2;
    let centerY = rect.height / 2;
    let baseRadius = Math.min(rect.width, rect.height) * 0.35;

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
      fieldShift: 0,
      lastTime: performance.now(),
      frame: 0,
    };

    const updateLayout = () => {
      rect = field.getBoundingClientRect();
      centerX = rect.width / 2;
      centerY = rect.height / 2;
      baseRadius = Math.min(rect.width, rect.height) * 0.35;
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
      const frameStride = 1;
      const vmin = Math.min(rect.width, rect.height) / 100;
      const baseTileW = Math.min(450, Math.max(260, 26 * vmin));
      const baseTileH = Math.min(320, Math.max(180, 18 * vmin));
      const visionStage = visionStageRef.current;
      const isVisionActive = activePanelRef.current === "vision";
      if (visionStage !== stageTimingRef.current.stage) {
        if (stageTimingRef.current.stage === "center" && visionStage !== "center") {
          stageTimingRef.current.time = time;
        }
        if (visionStage === "center") {
          stageTimingRef.current.time = 0;
        }
        stageTimingRef.current.stage = visionStage;
      }
      const stageElapsed =
        visionStage && visionStage !== "center" ? time - stageTimingRef.current.time : 0;
      const shiftReady = visionStage !== "center" && stageElapsed > 220;
      const fieldShift =
        isVisionActive && !closingVisionRef.current && shiftReady ? -rect.width * 0.12 : 0;
      state.fieldShift += (fieldShift - state.fieldShift) * 0.035;

      if (!prefersReducedMotion) {
        const dragState = dragStateRef.current;
        const yawDirection = Math.cos(state.baseRotX) >= 0 ? 1 : -1;
        const autoYaw = clampedDt * 0.00006 * yawDirection;
        state.baseRotY += autoYaw;
        if (dragState.isDragging) {
          state.baseRotX += (dragState.targetRotX - state.baseRotX) * 0.1;
          state.baseRotY += (dragState.targetRotY - state.baseRotY) * 0.1;
        }
        state.rotX = state.baseRotX;
        state.rotY = state.baseRotY;
      }

      state.pointerX = state.pointerTargetX;
      state.pointerY = state.pointerTargetY;
      state.fieldStrength = state.pointerActive ? 1 : 0;

      if (state.frame % frameStride !== 0) {
        rafId = window.requestAnimationFrame(updateScene);
        return;
      }

      field.style.setProperty("--pointer-x", (state.pointerAimY * 0.6 * state.pointerBlend).toFixed(3));
      field.style.setProperty("--pointer-y", (state.pointerAimX * 0.6 * state.pointerBlend).toFixed(3));

      const plates = platesRef.current;
      const rings = ringsRef.current;
      const repelRadius = baseRadius * 0.9;
      const projected = plates.map((plate, index) => {
        const base = project(plate.x, plate.y, plate.z);
        const dxBase = base.x - state.pointerX;
        const dyBase = base.y - state.pointerY;
        const dist = Math.max(1, Math.hypot(dxBase, dyBase));
        const falloff = Math.max(0, (repelRadius - dist) / repelRadius);
        const intensity = state.fieldStrength * falloff * falloff;
        const scaled = base;
        return {
          ...scaled,
          plate,
          intensity,
          index,
        };
      });

      projected.forEach((item, index) => {
        const tile = tileRefs.current[index];
        if (!tile) {
          return;
        }

        if (item.plate.baseId === "vision" && item.plate.isPrimary && closingAnimRef.current.active) {
          const closingAnim = closingAnimRef.current;
          const duration = 1200;
          const elapsed = time - closingAnim.startTime;
          const t = Math.min(1, elapsed / duration);
          tile.style.setProperty("--tile-w", `${baseTileW.toFixed(1)}px`);
          tile.style.setProperty("--tile-h", `${baseTileH.toFixed(1)}px`);
          tile.style.setProperty("--vision-clone-h", "0px");
          tile.style.transition = "width 0.9s ease, height 0.9s ease";
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const arc = -Math.sin(Math.PI * t) * Math.min(70, rect.height * 0.08);
          const liveX = item.x + item.plate.scatterX + state.fieldShift;
          const liveY = item.y + item.plate.scatterY;
          const normal = rotateNormal(item.plate.x, item.plate.y, item.plate.z);
          const yaw = Math.atan2(normal.x, normal.z);
          const pitch = -Math.asin(normal.y);
          const targetScale = item.p * item.plate.size * (0.78 + (item.z + 1) * 0.12) * 0.65;
          const wobbleX = Math.sin(time * 0.0017 + item.plate.wobbleSeed * 1.7) * 6 * item.intensity;
          const wobbleY = Math.cos(time * 0.0013 + item.plate.wobbleSeed * 1.1) * 6 * item.intensity;
          const wobbleZ = Math.sin(time * 0.0021 + item.plate.wobbleSeed * 0.9) * 10 * item.intensity;
          const idleWobble = Math.sin(time * 0.0011 + item.plate.wobbleSeed) * 4 * (1 - state.fieldStrength);

          const blendScale = targetScale + (closingAnim.startScale - targetScale) * (1 - eased);
          const blendYaw = yaw * 57.2958 + (closingAnim.startYaw - yaw * 57.2958) * (1 - eased);
          const blendPitch = pitch * 57.2958 + (closingAnim.startPitch - pitch * 57.2958) * (1 - eased);
          const blendX = liveX + (closingAnim.startX - liveX) * (1 - eased);
          const blendY = liveY + (closingAnim.startY - liveY) * (1 - eased) + arc * (1 - eased);
          const alphaRaw = Math.min(1, Math.max(0, (t - 0.85) / 0.15));
          const alpha = alphaRaw * alphaRaw * (3 - 2 * alphaRaw);
          const finalX = blendX * (1 - alpha) + liveX * alpha;
          const finalY = blendY * (1 - alpha) + liveY * alpha;
          const finalScale = blendScale * (1 - alpha) + targetScale * alpha;
          const finalYaw = blendYaw * (1 - alpha) + yaw * 57.2958 * alpha;
          const finalPitch = blendPitch * (1 - alpha) + pitch * 57.2958 * alpha;
          const blendTilt = item.plate.tilt + wobbleZ + idleWobble;
          tile.style.transition = "none";
          tile.style.transform =
            `translate(-50%, -50%) translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0) ` +
            `rotateY(${finalYaw.toFixed(2)}deg) ` +
            `rotateX(${finalPitch.toFixed(2)}deg) ` +
            `rotateZ(${blendTilt.toFixed(2)}deg) ` +
            `rotateX(${wobbleX.toFixed(2)}deg) ` +
            `rotateY(${wobbleY.toFixed(2)}deg) ` +
            `scale(${finalScale.toFixed(3)})`;
          if (t >= 1) {
            closingAnim.active = false;
            closingAnim.mode = "closing";
          }
          return;
        }

        if (item.plate.baseId === "vision" && item.plate.isPrimary && activePanelRef.current === "vision") {
          const stage = visionStageRef.current ?? "center";
          const marginX = Math.max(32, rect.width * 0.05);
          const marginY = Math.max(32, rect.height * 0.06);
          const baseW = baseTileW;
          const baseH = baseTileH;
          const baseScale = 1;
          const expandW = Math.min(rect.width - marginX * 2, baseW * 1.6);
          const expandH = rect.height * 0.8;

          let targetFinalW = baseW;
          let targetFinalH = baseH;
          let targetX = 0;
          let targetY = 0;

          if (stage === "dock") {
            targetFinalW = baseW;
            targetFinalH = baseH;
            const desiredX = rect.width - marginX - targetFinalW / 2;
            const desiredY = marginY + targetFinalH / 2;
            targetX = desiredX - centerX;
            targetY = desiredY - centerY;
          }
          if (stage === "expandx") {
            targetFinalW = expandW;
            targetFinalH = baseH;
            const desiredX = rect.width - marginX - targetFinalW / 2;
            const desiredY = marginY + targetFinalH / 2;
            targetX = desiredX - centerX;
            targetY = desiredY - centerY;
          }
          if (stage === "expandy") {
            targetFinalW = expandW;
            targetFinalH = baseH;
            const desiredX = rect.width - marginX - targetFinalW / 2;
            const desiredY = marginY + targetFinalH / 2;
            targetX = desiredX - centerX;
            targetY = desiredY - centerY;
          }

          tile.style.opacity = "1";
          tile.style.zIndex = "5200";
          tile.style.setProperty("--tile-depth-scale", baseScale.toFixed(4));
          tile.style.setProperty("--tile-w", `${(targetFinalW / baseScale).toFixed(1)}px`);
          tile.style.setProperty("--tile-h", `${(targetFinalH / baseScale).toFixed(1)}px`);
          const cloneFull = Math.max(0, expandH - baseH);
          const cloneHeight = stage === "expandy" ? cloneFull : stage === "expandx" ? cloneFull * 0.35 : 0;
          tile.style.setProperty("--vision-clone-h", `${cloneHeight.toFixed(1)}px`);
          tile.style.transition =
            "transform 1.35s cubic-bezier(0.22, 0.61, 0.36, 1), " +
            "width 1.35s cubic-bezier(0.22, 0.61, 0.36, 1), " +
            "height 1.35s cubic-bezier(0.22, 0.61, 0.36, 1), " +
            "box-shadow 1.35s ease";
          const focusScale = stage === "center" ? 1.08 : 1.04;
          visionPoseRef.current = { x: targetX, y: targetY, scale: focusScale, yaw: 0, pitch: 0 };
          tile.style.transform =
            `translate(-50%, -50%) translate3d(${targetX}px, ${targetY}px, 0) ` +
            `rotateY(0deg) rotateX(0deg) rotateZ(0deg) scale(${focusScale})`;
          return;
        }

        if (item.plate.baseId === "vision" && item.plate.isPrimary && activePanelRef.current !== "vision") {
          tile.style.setProperty("--tile-w", item.plate.width);
          tile.style.setProperty("--tile-h", item.plate.height);
          tile.style.transition = closingVisionRef.current
            ? "transform 1.15s cubic-bezier(0.22, 0.61, 0.36, 1), " +
              "width 0.9s ease, height 0.9s ease, box-shadow 0.9s ease"
            : "";
        }

        tile.style.transition = "";
        const isShattering = shatterIndexRef.current === index;
        const opacity = isShattering ? 0 : 1;
        const scale = item.p * item.plate.size * (0.78 + (item.z + 1) * 0.12) * 0.65;
        const tilt = item.plate.tilt;
        const isVisionPrimary = item.plate.baseId === "vision" && item.plate.isPrimary;
        const wobbleScale = activePanelRef.current === "vision" && isVisionPrimary ? 0 : 1;
        const wobbleX = Math.sin(time * 0.0017 + item.plate.wobbleSeed * 1.7) * 3.5 * wobbleScale;
        const wobbleY = Math.cos(time * 0.0013 + item.plate.wobbleSeed * 1.1) * 3.5 * wobbleScale;
        const wobbleZ = Math.sin(time * 0.0021 + item.plate.wobbleSeed * 0.9) * 6 * wobbleScale;
        const idleWobble = Math.sin(time * 0.0011 + item.plate.wobbleSeed) * 2.5 * wobbleScale;

        if (!activePanelRef.current) {
          const rectSize = tile.getBoundingClientRect();
          baseSizeRef.current[index] = { w: rectSize.width, h: rectSize.height, scale };
        }

        tile.style.opacity = opacity.toFixed(3);
        tile.style.zIndex = `${Math.round((item.z + 1) * 1000)}`;
        tile.style.setProperty("--tile-glow", item.intensity.toFixed(3));
        const normal = rotateNormal(item.plate.x, item.plate.y, item.plate.z);
        const yaw = Math.atan2(normal.x, normal.z);
        const pitch = -Math.asin(normal.y);
        const yawDeg = yaw * 57.2958;
        const pitchDeg = pitch * 57.2958;
        platePoseRef.current[index] = {
          yaw: yawDeg,
          pitch: pitchDeg,
          tilt: tilt + wobbleZ + idleWobble,
        };
        const fieldOffsetX = item.plate.baseId === "vision" && item.plate.isPrimary ? 0 : state.fieldShift;
        tile.style.transform =
          `translate(-50%, -50%) translate3d(${(item.x + item.plate.scatterX + fieldOffsetX).toFixed(2)}px, ` +
          `${(item.y + item.plate.scatterY).toFixed(2)}px, 0) ` +
          `rotateY(${yawDeg.toFixed(2)}deg) rotateX(${pitchDeg.toFixed(2)}deg) ` +
          `rotateZ(${(tilt + wobbleZ + idleWobble).toFixed(2)}deg) rotateX(${wobbleX.toFixed(2)}deg) ` +
          `rotateY(${wobbleY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

      });

      if (state.frame % 3 === 0) {
        rings.forEach((ring, ringIndex) => {
          const path = wireRefs.current[ringIndex];
          if (!path) {
            return;
          }
          let d = "";
          ring.forEach((point, pointIndex) => {
            const proj = project(point[0] * 1.08, point[1] * 1.08, point[2] * 1.08);
            const px = centerX + proj.x + state.fieldShift;
            const py = centerY + proj.y;
            d += `${pointIndex === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)} `;
          });
          path.setAttribute("d", d.trim());
        });
      }

      rafId = window.requestAnimationFrame(updateScene);
    };

    const handleMove = (event: PointerEvent) => {
      state.pointerTargetX = event.clientX - rect.left - centerX;
      state.pointerTargetY = event.clientY - rect.top - centerY;
      state.pointerActive = dragStateRef.current.isDragging;

      const dragState = dragStateRef.current;
      if (dragState.isPointerDown) {
        const dx = event.clientX - dragState.lastX;
        const dy = event.clientY - dragState.lastY;
        if (!dragState.isDragging) {
          const moveDist = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
          if (moveDist > 4) {
            dragState.isDragging = true;
            dragMovedRef.current = true;
            dragState.targetRotX = state.baseRotX;
            dragState.targetRotY = state.baseRotY;
            if (!dragState.hasCapture) {
              field.setPointerCapture(event.pointerId);
              dragState.hasCapture = true;
            }
          }
        }
        if (dragState.isDragging) {
          const yawSign = Math.cos(state.baseRotX) >= 0 ? 1 : -1;
          dragState.targetRotY += dx * 0.0025 * yawSign;
          dragState.targetRotX -= dy * 0.0025;
        }
        dragState.lastX = event.clientX;
        dragState.lastY = event.clientY;
      }
    };

    const handleEnter = (event: PointerEvent) => {
      state.pointerTargetX = event.clientX - rect.left - centerX;
      state.pointerTargetY = event.clientY - rect.top - centerY;
      state.pointerActive = dragStateRef.current.isDragging;
    };

    const handleLeave = () => {
      state.pointerActive = false;
      state.baseRotX = state.rotX;
      state.baseRotY = state.rotY;
      state.pointerTargetX = state.pointerX;
      state.pointerTargetY = state.pointerY;
    };

    const handlePointerDown = (event: PointerEvent) => {
      dragStateRef.current.isPointerDown = true;
      dragStateRef.current.isDragging = false;
      dragStateRef.current.hasCapture = false;
      dragStateRef.current.pointerId = event.pointerId;
      dragStateRef.current.startX = event.clientX;
      dragStateRef.current.startY = event.clientY;
      dragStateRef.current.lastX = event.clientX;
      dragStateRef.current.lastY = event.clientY;
      dragMovedRef.current = false;
    };

    const handlePointerUp = (event: PointerEvent) => {
      dragStateRef.current.isPointerDown = false;
      dragStateRef.current.isDragging = false;
      if (dragStateRef.current.hasCapture) {
        field.releasePointerCapture(event.pointerId);
      }
      dragStateRef.current.hasCapture = false;
      dragStateRef.current.pointerId = -1;
      state.baseRotX = state.rotX;
      state.baseRotY = state.rotY;
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
    field.addEventListener("pointerdown", handlePointerDown);
    field.addEventListener("pointerup", handlePointerUp);
    field.addEventListener("pointercancel", handlePointerUp);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", handleResize);

    return () => {
      field.removeEventListener("pointermove", handleMove);
      field.removeEventListener("pointerenter", handleEnter);
      field.removeEventListener("pointerleave", handleLeave);
      field.removeEventListener("pointerdown", handlePointerDown);
      field.removeEventListener("pointerup", handlePointerUp);
      field.removeEventListener("pointercancel", handlePointerUp);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  const handlePlateClick = (plate: Plate, index: number) => {
    if (
      dragMovedRef.current ||
      isTransitioning ||
      transitionStartTimeoutRef.current !== null
    ) {
      return;
    }
    if (activePanelRef.current) {
      return;
    }
    if (plate.baseId === "vision") {
      if (isClosingVision || closingAnimRef.current.active) {
        return;
      }
      if (activePanelRef.current === "vision") {
        return;
      }
      closingAnimRef.current.active = false;
      closingAnimRef.current.mode = "closing";
      setIsClosingVision(false);
      setVisionStage(null);
      setActivePanel("vision");
      setVisionStage("center");
      if (visionTimeoutsRef.current.length) {
        visionTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        visionTimeoutsRef.current = [];
      }
      visionTimeoutsRef.current.push(
        window.setTimeout(() => setVisionStage("dock"), 1350),
        window.setTimeout(() => setVisionStage("expandx"), 2700),
        window.setTimeout(() => setVisionStage("expandy"), 3500)
      );
      return;
    }
    if (plate.baseId === "visuales") {
      const transitionDelay = 80;
      const portalArriveDelay = 1400 + transitionDelay;
      const portalDepartDelay = 2250 + transitionDelay;
      const portalNavigateDelay = 4500 + transitionDelay;
      const tile = tileRefs.current[index];
      if (tile) {
        setPortalOrigin({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        spawnVisualesFragments(tile, index);
        setShatterIndex(index);
        shatterStartRef.current = performance.now();
        if (fragmentTimeoutRef.current !== null) {
          window.clearTimeout(fragmentTimeoutRef.current);
        }
        fragmentTimeoutRef.current = window.setTimeout(() => {
          setShatterIndex(null);
          if (portalRef.current) {
            portalRef.current.innerHTML = "";
          }
        }, 4600);
      }
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      if (transitionStartTimeoutRef.current !== null) {
        window.clearTimeout(transitionStartTimeoutRef.current);
      }
      if (portalArriveTimeoutRef.current !== null) {
        window.clearTimeout(portalArriveTimeoutRef.current);
      }
      if (portalDepartTimeoutRef.current !== null) {
        window.clearTimeout(portalDepartTimeoutRef.current);
      }
      setIsPortalArriving(false);
      setIsPortalDeparting(false);
      transitionStartTimeoutRef.current = window.setTimeout(() => {
        transitionStartTimeoutRef.current = null;
        setIsTransitioning(true);
      }, transitionDelay);
      portalArriveTimeoutRef.current = window.setTimeout(() => {
        setIsPortalArriving(true);
      }, portalArriveDelay);
      portalDepartTimeoutRef.current = window.setTimeout(() => {
        setIsPortalArriving(false);
        setIsPortalDeparting(true);
      }, portalDepartDelay);
      transitionTimeoutRef.current = window.setTimeout(() => {
        try {
          sessionStorage.setItem("visuales-enter-from-home", "1");
        } catch {
          // Ignore storage errors (private mode / blocked storage).
        }
        router.push("/visuales?intro=1");
      }, portalNavigateDelay);
    }
  };

  const handleVisionClose = () => {
    if (isClosingVision || closingAnimRef.current.active) {
      return;
    }
    if (visionTimeoutsRef.current.length) {
      visionTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      visionTimeoutsRef.current = [];
    }
    setIsClosingVision(true);
    closingAnimRef.current.active = true;
    closingAnimRef.current.mode = "closing";
    closingAnimRef.current.startTime = performance.now();
    closingAnimRef.current.startX = visionPoseRef.current.x;
    closingAnimRef.current.startY = visionPoseRef.current.y;
    closingAnimRef.current.startScale = visionPoseRef.current.scale;
    closingAnimRef.current.startYaw = visionPoseRef.current.yaw;
    closingAnimRef.current.startPitch = visionPoseRef.current.pitch;
    setVisionStage("dock");
    window.setTimeout(() => {
      setActivePanel(null);
      setVisionStage(null);
    }, 1050);
    window.setTimeout(() => {
      setIsClosingVision(false);
    }, 1300);
  };

  const plates = platesRef.current;
  const rings = ringsRef.current;
  const isLocked = isTransitioning;
  const isVisionOpen = activePanel === "vision";

  return (
    <div
      className={`forest-canvas ${isTransitioning ? "is-transitioning" : ""} ${
        isPortalArriving ? "is-portal-arriving" : ""
      } ${isPortalDeparting ? "is-portal-departing" : ""}`}
    >
      <div
        ref={fieldRef}
        className={`hero-field ${isLocked ? "is-locked" : ""} ${isVisionOpen ? "is-vision-open" : ""} ${
          isVisionOpen && visionStage ? `vision-stage-${visionStage}` : ""
        }`}
        role="presentation"
        onContextMenu={(event) => {
          event.preventDefault();
        }}
      >
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
        {plates.map((plate, index) => {
          const isVisionPlate = plate.baseId === "vision" && plate.isPrimary;
          const isVisionActivePlate = isVisionOpen && isVisionPlate;
          return (
            <button
              key={plate.id}
              type="button"
              className={`hero-tile ${plate.className ?? ""} ${
                isVisionActivePlate ? "hero-tile--vision-primary hero-tile--active" : ""
              } ${shatterIndex === index ? "hero-tile--shatter" : ""}`}
              disabled={isTransitioning}
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
              onClick={() => handlePlateClick(plate, index)}
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
              {isVisionActivePlate ? (
                <>
                  <span className="hero-tile__seam" aria-hidden />
                  <span className="hero-tile__clone" aria-hidden>
                    <span className="hero-tile__clone-title">Vision CodevaMP Studio</span>
                    <span className="hero-tile__clone-body">
                      Creamos experiencias donde la tecnologia se vuelve sensible: interfaces que responden a la curiosidad,
                      piezas que crecen con la comunidad y escenas que mezclan juego, sonido y visuales.
                      La vision es un laboratorio abierto donde cada proyecto invita a tocar, explorar y descubrir nuevas capas del estudio.
                    </span>
                  </span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        className={`portal-transition ${isTransitioning ? "is-active" : ""} ${
          isPortalDeparting ? "is-portal-departing" : ""
        }`}
        style={
          {
            "--portal-x": `${portalOrigin.x.toFixed(1)}px`,
            "--portal-y": `${portalOrigin.y.toFixed(1)}px`,
            "--portal-transition-scale": isPortalDeparting ? "0.9" : "1",
          } as CSSProperties
        }
        aria-hidden
      >
        <div className="portal-fragments" ref={portalRef} aria-hidden />
        <div className="portal-vortex" />
        <div className="portal-core" />
      </div>
      <button
        type="button"
        className={`vision-close ${activePanel === "vision" ? "is-visible" : ""} ${
          isClosingVision ? "is-closing" : ""
        }`}
        onClick={handleVisionClose}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
        disabled={isClosingVision}
      >
        Cerrar
      </button>
    </div>
  );
}
