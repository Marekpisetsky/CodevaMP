"use client";

import { useEffect, useRef, useState } from "react";

type DevSurfaceStageProps = {
  animated: boolean;
};

export default function DevSurfaceStage({ animated }: DevSurfaceStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoSrc = process.env.NEXT_PUBLIC_DEV_SURFACE_VIDEO_URL?.trim() || "";
  const [showVideo] = useState(Boolean(videoSrc));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    let pointerX = 0.5;
    let pointerY = 0.35;
    let frameStep = 1;
    let laneCount = 9;
    let packetCount = 3;
    let photonCount = 8;
    let meshRows = 7;
    let meshCols = 14;
    const laneConfigs = Array.from({ length: laneCount }, () => {
      const exitMask = Array.from({ length: packetCount }, () => Math.random() < 0.42);
      if (!exitMask.some(Boolean)) exitMask[Math.floor(Math.random() * packetCount)] = true;
      const exitLag = Array.from({ length: packetCount }, (_, idx) =>
        exitMask[idx] ? 0.025 + Math.random() * 0.09 : 0
      );
      return {
        phase: Math.random() * Math.PI * 2,
        speed: 0.72 + Math.random() * 0.62,
        delay: Math.random() * 0.34,
        exitMask,
        exitLag,
      };
    });

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      pointerY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const isCompact = rect.width < 760;
      const dprCap = isCompact ? 1.25 : 1.6;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      frameStep = isCompact ? 1.24 : rect.width < 1080 ? 1.1 : 1;
      laneCount = isCompact ? 7 : 9;
      packetCount = isCompact ? 2 : 3;
      photonCount = isCompact ? 5 : 8;
      meshRows = isCompact ? 5 : 7;
      meshCols = isCompact ? 9 : 14;
    };

    const drawFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      frame += frameStep;
      ctx.clearRect(0, 0, w, h);
      const t = frame * 0.008;
      const glowX = w * (0.2 + 0.6 * pointerX);
      const glowY = h * (0.1 + 0.6 * pointerY);

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "rgba(7, 20, 25, 0.40)");
      bg.addColorStop(1, "rgba(7, 35, 18, 0.45)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const ring = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(w, h) * 0.35);
      ring.addColorStop(0, "rgba(34, 211, 238, 0.32)");
      ring.addColorStop(1, "rgba(34, 211, 238, 0.0)");
      ctx.fillStyle = ring;
      ctx.fillRect(0, 0, w, h);

      const px = Math.max(1, canvas.width / Math.max(canvas.clientWidth, 1));
      const startX = -w * 0.08;
      const center = { x: w * 0.54, y: h * 0.5 };
      const sink = { x: w * 0.9, y: h * 0.5 };
      const vortexRadius = 18 * px + Math.sin(t * 1.1) * (1.9 * px);
      const flowPaths = Array.from({ length: laneCount }, (_, lane) => {
        const laneRatio = lane / Math.max(1, laneCount - 1);
        const spread = (laneRatio - 0.5) * h * 0.72;
        const cfg = laneConfigs[lane];
        const wave = Math.sin(t * 0.8 + lane * 0.75 + pointerX + cfg.phase) * h * 0.007;
        const a = { x: startX, y: center.y + spread + wave };
        const b = { x: center.x, y: center.y + spread * 0.28 + wave * 0.45 };
        const c = { x: sink.x, y: sink.y + spread * 0.08 + wave * 0.18 };
        return { a, b, c, lane };
      });

      const referenceTravel = 1380;
      const travelScale = Math.min(1.85, Math.max(1, referenceTravel / Math.max(w, 1)));

      const quadControl = (from: { x: number; y: number }, to: { x: number; y: number }, bend: number) => {
        const mx = from.x + (to.x - from.x) * 0.5;
        const my = from.y + (to.y - from.y) * 0.5;
        return {
          x: mx + bend * w * 0.045,
          y: my - bend * h * 0.03,
        };
      };

      const quadPoint = (
        p0: { x: number; y: number },
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        tValue: number
      ) => {
        const u = 1 - tValue;
        return {
          x: u * u * p0.x + 2 * u * tValue * p1.x + tValue * tValue * p2.x,
          y: u * u * p0.y + 2 * u * tValue * p1.y + tValue * tValue * p2.y,
        };
      };

      const quadTangent = (
        p0: { x: number; y: number },
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        tValue: number
      ) => ({
        x: 2 * (1 - tValue) * (p1.x - p0.x) + 2 * tValue * (p2.x - p1.x),
        y: 2 * (1 - tValue) * (p1.y - p0.y) + 2 * tValue * (p2.y - p1.y),
      });

      const lensWarp = (point: { x: number; y: number }) => {
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const r = Math.hypot(dx, dy) + 1e-3;
        const lensR = vortexRadius * 3.9;
        if (r > lensR) return point;

        const ringCore = vortexRadius * 2.35;
        const ringBand = vortexRadius * 1.0;
        const ringDist = Math.abs(r - ringCore);
        const ringInfluence = Math.max(0, 1 - ringDist / ringBand);
        const centerBand = vortexRadius * 0.5;
        const centerDist = Math.abs(r - vortexRadius * 1.02);
        const centerInfluence = Math.max(0, 1 - centerDist / centerBand);
        const influence = Math.pow(1 - r / lensR, 1.6) * 0.48 + ringInfluence * 0.95 + centerInfluence * 0.92;

        // Pure radial lensing: no angular twist. This keeps the distortion centered and physically cleaner.
        const radialPush = 1 + 0.52 * influence;
        const radialPull = 1 - 0.09 * Math.pow(Math.max(0, 1 - r / (vortexRadius * 1.2)), 2);
        const radialScale = radialPush * radialPull;
        const eventHorizon = vortexRadius * 0.98;
        const safeR = Math.max(r, 1e-3);

        // Force radial opening at the exact black-hole core region.
        // Any point entering the horizon is projected to the rim, creating a clean split.
        if (safeR < eventHorizon) {
          const unitX = dx / safeR;
          const unitY = dy / safeR;
          return {
            x: center.x + unitX * eventHorizon,
            y: center.y + unitY * eventHorizon,
          };
        }

        return {
          x: center.x + dx * radialScale,
          y: center.y + dy * radialScale,
        };
      };

      const drawCurve = (
        from: { x: number; y: number },
        to: { x: number; y: number },
        alpha: number,
        control: { x: number; y: number },
        reveal = 1
      ) => {
        ctx.lineWidth = px;
        ctx.strokeStyle = `rgba(67, 208, 160, ${alpha})`;
        ctx.beginPath();
        const samples = 40;
        const limit = Math.max(1, Math.floor(samples * reveal));
        for (let i = 0; i <= limit; i += 1) {
          const tSample = (i / samples) / Math.max(reveal, 1e-3);
          const clampedSample = Math.min(1, tSample);
          const raw = quadPoint(from, control, to, clampedSample);
          const warped = lensWarp(raw);
          if (i === 0) ctx.moveTo(warped.x, warped.y);
          else ctx.lineTo(warped.x, warped.y);
        }
        ctx.stroke();
      };

      for (const path of flowPaths) {
        const laneNorm = (path.lane / Math.max(1, laneCount - 1)) * 2 - 1;
        const controlAB = quadControl(path.a, path.b, -laneNorm * 0.9);
        const controlBC = quadControl(path.b, path.c, laneNorm * 0.3);
        drawCurve(path.a, path.b, 0.24, controlAB);
        drawCurve(path.b, path.c, 0.2, controlBC);

        for (let p = 0; p < packetCount; p += 1) {
          const cfg = laneConfigs[path.lane];
          const base = frame * (0.0027 + path.lane * 0.00016) * cfg.speed * travelScale;
          const raw = base + p / packetCount + cfg.phase / (Math.PI * 2) - cfg.delay;
          const local = ((raw % 1) + 1) % 1;
          const inEnd = 0.68;
          const outStart = 0.74;
          const eps = 0.015;
          let pos: { x: number; y: number };
          let tangent: { x: number; y: number };
          let opacityScale = 1;
          let thickness = 1.18 * px;

          if (local < inEnd) {
            const qLinear = local / inEnd;
            // Accelerate while entering the distortion zone.
            const q = Math.pow(qLinear, 1.85);
            const posRaw = quadPoint(path.a, controlAB, path.b, q);
            const tangentRaw = quadTangent(path.a, controlAB, path.b, q);
            const p0 = lensWarp(quadPoint(path.a, controlAB, path.b, Math.max(0, q - eps)));
            const p1 = lensWarp(quadPoint(path.a, controlAB, path.b, Math.min(1, q + eps)));
            pos = lensWarp(posRaw);
            tangent = {
              x: p1.x - p0.x + tangentRaw.x * 0.02,
              y: p1.y - p0.y + tangentRaw.y * 0.02,
            };
            const rToCenter = Math.hypot(pos.x - center.x, pos.y - center.y);
            const vanishStart = vortexRadius * 2.3;
            const vanishEnd = vortexRadius * 1.12;
            if (rToCenter < vanishStart) {
              const d = Math.max(0, Math.min(1, (rToCenter - vanishEnd) / (vanishStart - vanishEnd)));
              opacityScale = d;
            }
            thickness = 1.55 * px;
          } else if (local < outStart) {
            // Brief invisible phase while crossing the event-horizon core.
            continue;
          } else {
            if (!cfg.exitMask[p]) {
              continue;
            }
            const lag = cfg.exitLag[p] ?? 0;
            const outStartLagged = Math.min(0.96, outStart + lag);
            if (local < outStartLagged) {
              continue;
            }
            const qLinear = (local - outStartLagged) / (1 - outStartLagged);
            const q = Math.pow(qLinear, 0.88);
            const posRaw = quadPoint(path.b, controlBC, path.c, q);
            const tangentRaw = quadTangent(path.b, controlBC, path.c, q);
            const p0 = lensWarp(quadPoint(path.b, controlBC, path.c, Math.max(0, q - eps)));
            const p1 = lensWarp(quadPoint(path.b, controlBC, path.c, Math.min(1, q + eps)));
            pos = lensWarp(posRaw);
            tangent = {
              x: p1.x - p0.x + tangentRaw.x * 0.02,
              y: p1.y - p0.y + tangentRaw.y * 0.02,
            };
            thickness = 1.22 * px;
          }

          const tangentLen = Math.hypot(tangent.x, tangent.y) || 1;
          const dirX = tangent.x / tangentLen;
          const dirY = tangent.y / tangentLen;
          const x = pos.x;
          const y = pos.y;
          const trail = 42 * px;

          const grad = ctx.createLinearGradient(
            x - dirX * trail,
            y - dirY * trail,
            x + dirX * 6 * px,
            y + dirY * 6 * px
          );
          grad.addColorStop(0, "rgba(34, 211, 238, 0)");
          grad.addColorStop(0.58, `rgba(34, 211, 238, ${0.46 * opacityScale})`);
          grad.addColorStop(1, `rgba(74, 222, 128, ${0.92 * opacityScale})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = thickness;
          ctx.beginPath();
          ctx.moveTo(x - dirX * trail, y - dirY * trail);
          ctx.lineTo(x + dirX * 6 * px, y + dirY * 6 * px);
          ctx.stroke();
        }
      }

      // Wire mesh (full-scale background system)
      ctx.lineWidth = px;
      for (let i = 0; i < meshRows; i += 1) {
        const rowSpacing = meshRows > 1 ? 0.8 / (meshRows - 1) : 0;
        const y = h * (0.1 + i * rowSpacing) + Math.sin(t * 0.7 + i * 0.9) * h * 0.01;
        const titleFade = y < h * 0.58 ? 0.6 : 1;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 * titleFade})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let j = 0; j < meshCols; j += 1) {
        const x = meshCols > 1 ? w * (j / (meshCols - 1)) : w * 0.5;
        const top = h * (0.06 + Math.sin(t * 0.5 + j) * 0.01);
        const bottom = h * (0.94 + Math.cos(t * 0.45 + j) * 0.01);
        ctx.strokeStyle = "rgba(74, 222, 128, 0.08)";
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }

      // Central wormhole / black-hole style processor
      const gravityWell = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, vortexRadius * 3.2);
      gravityWell.addColorStop(0, "rgba(2, 8, 14, 0.94)");
      gravityWell.addColorStop(0.35, "rgba(2, 14, 24, 0.9)");
      gravityWell.addColorStop(1, "rgba(2, 14, 24, 0)");
      ctx.fillStyle = gravityWell;
      ctx.beginPath();
      ctx.arc(center.x, center.y, vortexRadius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      for (let ringIndex = 0; ringIndex < 4; ringIndex += 1) {
        const rr = vortexRadius * (0.95 + ringIndex * 0.42);
        const spin = t * (1.5 - ringIndex * 0.18);
        const start = spin + ringIndex * 0.7;
        const end = start + 1.45 + Math.sin(t + ringIndex) * 0.22;
        ctx.strokeStyle =
          ringIndex % 2 === 0 ? "rgba(96, 165, 250, 0.52)" : "rgba(34, 211, 238, 0.46)";
        ctx.lineWidth = Math.max(px, (2.2 - ringIndex * 0.35) * px);
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, rr * 1.25, rr * 0.68, -0.22, start, end);
        ctx.stroke();
      }

      // Bright photon ring and accretion streaks for a clear "active singularity" effect.
      const photonRing = ctx.createRadialGradient(center.x, center.y, vortexRadius * 1.25, center.x, center.y, vortexRadius * 1.9);
      photonRing.addColorStop(0, "rgba(56, 189, 248, 0)");
      photonRing.addColorStop(0.45, "rgba(56, 189, 248, 0.34)");
      photonRing.addColorStop(0.62, "rgba(103, 232, 249, 0.72)");
      photonRing.addColorStop(0.75, "rgba(34, 211, 238, 0.25)");
      photonRing.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = photonRing;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, vortexRadius * 2.18, vortexRadius * 1.18, -0.22, 0, Math.PI * 2);
      ctx.fill();

      for (let arc = 0; arc < 3; arc += 1) {
        const base = t * (1.7 + arc * 0.2) + arc * 1.9;
        const a0 = base;
        const a1 = base + 1.08 + Math.sin(t * 1.9 + arc) * 0.25;
        ctx.strokeStyle = arc === 1 ? "rgba(125, 211, 252, 0.76)" : "rgba(34, 211, 238, 0.58)";
        ctx.lineWidth = (2.4 - arc * 0.45) * px;
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, vortexRadius * (2.02 + arc * 0.24), vortexRadius * (1.02 + arc * 0.14), -0.22, a0, a1);
        ctx.stroke();
      }

      // Fast orbiting micro-photons around the black hole (independent from incoming rays).
      for (let i = 0; i < photonCount; i += 1) {
        const ringMix = i % 2;
        const rx = vortexRadius * (1.74 + ringMix * 0.4);
        const ry = vortexRadius * (0.94 + ringMix * 0.2);
        const theta = t * (2.8 + ringMix * 0.6) + i * (Math.PI * 2 / photonCount);
        const cosR = Math.cos(-0.22);
        const sinR = Math.sin(-0.22);
        const ex = rx * Math.cos(theta);
        const ey = ry * Math.sin(theta);
        const tx = -rx * Math.sin(theta);
        const ty = ry * Math.cos(theta);
        const x = center.x + ex * cosR - ey * sinR;
        const y = center.y + ex * sinR + ey * cosR;
        const dirX = tx * cosR - ty * sinR;
        const dirY = tx * sinR + ty * cosR;
        const len = Math.hypot(dirX, dirY) || 1;
        const ux = dirX / len;
        const uy = dirY / len;
        const streak = 14 * px;
        const grad = ctx.createLinearGradient(x - ux * streak, y - uy * streak, x + ux * 3 * px, y + uy * 3 * px);
        grad.addColorStop(0, "rgba(125, 211, 252, 0)");
        grad.addColorStop(0.55, "rgba(125, 211, 252, 0.56)");
        grad.addColorStop(1, "rgba(103, 232, 249, 0.98)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = (1.4 - ringMix * 0.18) * px;
        ctx.beginPath();
        ctx.moveTo(x - ux * streak, y - uy * streak);
        ctx.lineTo(x + ux * 3 * px, y + uy * 3 * px);
        ctx.stroke();
      }

      const caustic = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, vortexRadius * 2.6);
      caustic.addColorStop(0, "rgba(186, 230, 253, 0.2)");
      caustic.addColorStop(0.35, "rgba(125, 211, 252, 0.12)");
      caustic.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = caustic;
      ctx.beginPath();
      ctx.ellipse(center.x + vortexRadius * 0.28, center.y - vortexRadius * 0.16, vortexRadius * 1.7, vortexRadius * 0.9, -0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(1, 4, 7, 0.98)";
      ctx.beginPath();
      ctx.arc(center.x, center.y, vortexRadius * 0.56, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(191, 219, 254, 0.56)";
      ctx.lineWidth = px;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, vortexRadius * 1.18, vortexRadius * 0.74, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Gravitational lensing distortion ring.
      const lensScale = 1 + 0.025 * Math.sin(t * 2.2);
      const lensRadiusX = vortexRadius * 1.9 * lensScale;
      const lensRadiusY = vortexRadius * 1.18 * lensScale;
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(-0.2);

      const lens = ctx.createRadialGradient(0, 0, vortexRadius * 0.9, 0, 0, vortexRadius * 2.5);
      lens.addColorStop(0, "rgba(125, 211, 252, 0)");
      lens.addColorStop(0.36, "rgba(125, 211, 252, 0.24)");
      lens.addColorStop(0.52, "rgba(125, 211, 252, 0.32)");
      lens.addColorStop(0.7, "rgba(56, 189, 248, 0.16)");
      lens.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = lens;
      ctx.beginPath();
      ctx.ellipse(0, 0, lensRadiusX, lensRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(186, 230, 253, 0.48)";
      ctx.lineWidth = 2.1 * px;
      ctx.beginPath();
      ctx.ellipse(0, 0, lensRadiusX * 1.02, lensRadiusY * 1.02, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // Final destination node
      const hubPulse = 24 * px + Math.sin(t * 1.4 + 0.3) * (2.6 * px);
      const outer = ctx.createRadialGradient(sink.x, sink.y, 0, sink.x, sink.y, hubPulse * 2.1);
      outer.addColorStop(0, "rgba(74, 222, 128, 0.82)");
      outer.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = outer;
      ctx.beginPath();
      ctx.arc(sink.x, sink.y, hubPulse * 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(10, 20, 26, 0.95)";
      ctx.beginPath();
      ctx.arc(sink.x, sink.y, hubPulse * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(193, 255, 235, 0.78)";
      ctx.lineWidth = px;
      ctx.beginPath();
      ctx.arc(sink.x, sink.y, hubPulse * 0.86, 0, Math.PI * 2);
      ctx.stroke();

      if (animated) {
        raf = window.requestAnimationFrame(drawFrame);
      }
    };

    resize();
    if (animated) {
      canvas.addEventListener("pointermove", onMove);
    }
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(drawFrame);

    return () => {
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(raf);
    };
  }, [animated]);

  return (
    <div className="dev-surface-stage" aria-hidden>
      {showVideo ? (
        <video
          className="dev-surface-stage__video"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : null}
      <canvas ref={canvasRef} className="dev-surface-stage__canvas" />
    </div>
  );
}
