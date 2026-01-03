"use client";

import { useEffect, useRef } from "react";

const HOLD_DURATION = 1100;

export default function KeyboardScene() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const holdFrames = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    canvasRef.current?.classList.remove("is-teleport", "is-holding");
  }, []);

  return (
    <div ref={canvasRef} className="keyboard-canvas portal-canvas" role="presentation">
      <div className="portal-shell" aria-label="Ventana al laboratorio">
        <div className="portal-frame" aria-hidden>
          <div className="portal-view">
            <div className="portal-horizon" />
            <div className="portal-structure" />
            <div className="portal-floor" />
            <div className="portal-powerline" />
            <div className="portal-field" />
            <div className="portal-grain" />
            <div className="portal-logo">CodevaMP</div>
          </div>
          <div className="portal-controls" aria-hidden>
            <span className="portal-controls__label">Audio</span>
            <div className="portal-controls__knob" />
            <div className="portal-controls__knob" />
            <div className="portal-controls__slider">
              <span />
            </div>
          </div>
        </div>
        <div className="portal-burst" aria-hidden />
        <div className="portal-meta">
          <div className="portal-note">
            <span className="portal-note__title">Manifiesto</span>
            <span className="portal-note__text">
              Sistemas vivos, exploracion lenta y capas que responden a la curiosidad.
            </span>
          </div>
          <button
            type="button"
            className="portal-entry"
            onPointerLeave={(event) => {
              const target = event.currentTarget;
              if (target.classList.contains("is-holding")) {
                target.classList.remove("is-holding");
                target.style.setProperty("--hold-progress", "0");
                canvasRef.current?.classList.remove("is-holding");
              }
              if (!canvasRef.current?.classList.contains("is-teleport")) {
                canvasRef.current?.classList.remove("is-teleport");
              }
              const holdFrame = holdFrames.current.get(0);
              if (holdFrame) {
                window.cancelAnimationFrame(holdFrame);
                holdFrames.current.delete(0);
              }
            }}
            onPointerDown={(event) => {
              const target = event.currentTarget;
              const start = performance.now();
              target.classList.add("is-holding");
              target.style.setProperty("--hold-progress", "0");
              canvasRef.current?.classList.add("is-holding");

              const tick = (now: number) => {
                const progress = Math.min(1, (now - start) / HOLD_DURATION);
                target.style.setProperty("--hold-progress", progress.toFixed(3));
                if (progress >= 1) {
                  target.classList.remove("is-holding");
                  canvasRef.current?.classList.remove("is-holding");
                  canvasRef.current?.classList.add("is-teleport");
                  return;
                }
                if (target.classList.contains("is-holding")) {
                  const frame = window.requestAnimationFrame(tick);
                  holdFrames.current.set(0, frame);
                }
              };

              const frame = window.requestAnimationFrame(tick);
              holdFrames.current.set(0, frame);
            }}
            onPointerUp={(event) => {
              const target = event.currentTarget;
              if (!target.classList.contains("is-holding")) {
                return;
              }
              target.classList.remove("is-holding");
              target.style.setProperty("--hold-progress", "0");
              canvasRef.current?.classList.remove("is-holding");
              const holdFrame = holdFrames.current.get(0);
              if (holdFrame) {
                window.cancelAnimationFrame(holdFrame);
                holdFrames.current.delete(0);
              }
            }}
            onPointerCancel={(event) => {
              const target = event.currentTarget;
              if (!target.classList.contains("is-holding")) {
                return;
              }
              target.classList.remove("is-holding");
              target.style.setProperty("--hold-progress", "0");
              canvasRef.current?.classList.remove("is-holding");
              const holdFrame = holdFrames.current.get(0);
              if (holdFrame) {
                window.cancelAnimationFrame(holdFrame);
                holdFrames.current.delete(0);
              }
            }}
          >
            <span className="portal-entry__label">Manten para entrar</span>
            <span className="portal-entry__progress" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className="portal-poweroff"
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) {
              return;
            }
            canvas.classList.add("is-exit");
            window.setTimeout(() => {
              canvas.classList.remove("is-teleport", "is-exit");
            }, 700);
          }}
        >
          Apagar
        </button>
      </div>
    </div>
  );
}
