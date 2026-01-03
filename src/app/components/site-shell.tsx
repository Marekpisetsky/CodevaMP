"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
export default function SiteShell({
  children,
  currentPath,
  disableEffects = false,
  enableHeroTransition = false,
  heroSectionId = "hero-section",
  nextSectionId = "intro-section",
}: {
  children: ReactNode;
  currentPath?: string;
  disableEffects?: boolean;
  enableHeroTransition?: boolean;
  heroSectionId?: string;
  nextSectionId?: string;
}) {
  void currentPath;
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const heroLockRef = useRef(false);
  const triggerHeroZoomRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (disableEffects) {
      return;
    }
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }

    scene.style.setProperty("--parallax-x", "0px");
    scene.style.setProperty("--parallax-y", "0px");
    scene.style.setProperty("--idle-x", "0px");
    scene.style.setProperty("--idle-y", "0px");
  }, [disableEffects]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const state = {
      dragging: false,
      heroDrag: false,
      pendingDrag: false,
      startY: 0,
      startScroll: 0,
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        event.preventDefault();
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select")) {
        return;
      }
      if (enableHeroTransition && root.scrollTop <= 2) {
        state.heroDrag = true;
        state.startY = event.clientY;
        root.setPointerCapture(event.pointerId);
        return;
      }
      state.pendingDrag = true;
      state.startY = event.clientY;
      state.startScroll = root.scrollTop;
      root.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (state.heroDrag) {
        const deltaY = event.clientY - state.startY;
        if (deltaY < -16) {
          triggerHeroZoomRef.current?.();
          state.heroDrag = false;
        }
        return;
      }
      if (!state.dragging && state.pendingDrag) {
        const deltaY = event.clientY - state.startY;
        if (Math.abs(deltaY) < 6) {
          return;
        }
        state.dragging = true;
        state.pendingDrag = false;
        root.classList.add("is-dragging");
      }
      if (!state.dragging) {
        return;
      }
      const deltaY = event.clientY - state.startY;
      root.scrollTop = state.startScroll - deltaY;
    };

    const endDrag = (event: PointerEvent) => {
      if (state.heroDrag) {
        state.heroDrag = false;
        root.releasePointerCapture(event.pointerId);
        return;
      }
      if (state.pendingDrag) {
        state.pendingDrag = false;
        root.releasePointerCapture(event.pointerId);
        return;
      }
      if (!state.dragging) {
        return;
      }
      state.dragging = false;
      root.classList.remove("is-dragging");
      root.releasePointerCapture(event.pointerId);
    };

    const handleContextMenu = (event: Event) => {
      event.preventDefault();
    };

    let rafId = 0;
    const updateScrollProgress = () => {
      const height = root.clientHeight || 1;
      const progress = Math.min(1, Math.max(0, root.scrollTop / (height * 1.8)));
      const zoomThreshold = 0.55;
      const zoomProgress = Math.min(1, progress / zoomThreshold);
      const revealProgress = Math.min(1, Math.max(0, (progress - zoomThreshold) / (1 - zoomThreshold)));
      document.documentElement.style.setProperty("--scene-progress", progress.toFixed(4));
      document.documentElement.style.setProperty("--scene-zoom", zoomProgress.toFixed(4));
      document.documentElement.style.setProperty("--scene-reveal", revealProgress.toFixed(4));
    };
    const scheduleUpdate = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateScrollProgress();
      });
    };

    updateScrollProgress();

    root.addEventListener("scroll", scheduleUpdate, { passive: true });
    root.addEventListener("pointerdown", handlePointerDown);
    root.addEventListener("pointermove", handlePointerMove);
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);
    root.addEventListener("contextmenu", handleContextMenu);
    root.addEventListener("auxclick", handleContextMenu);

    return () => {
      root.removeEventListener("scroll", scheduleUpdate);
      root.removeEventListener("pointerdown", handlePointerDown);
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerup", endDrag);
      root.removeEventListener("pointercancel", endDrag);
      root.removeEventListener("contextmenu", handleContextMenu);
      root.removeEventListener("auxclick", handleContextMenu);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [enableHeroTransition]);

  useEffect(() => {
    if (!enableHeroTransition) {
      return;
    }
    const root = rootRef.current;
    const overlay = overlayRef.current;
    const hero = document.getElementById(heroSectionId);
    const nextSection = document.getElementById(nextSectionId);
    if (!root || !overlay || !hero || !nextSection) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    let isLocked = false;
    let zoomTimer = 0;
    let overlayTimer = 0;
    let unlockTimer = 0;

    const clearTimers = () => {
      window.clearTimeout(zoomTimer);
      window.clearTimeout(overlayTimer);
      window.clearTimeout(unlockTimer);
    };

    const releaseLock = () => {
      isLocked = false;
      heroLockRef.current = false;
      root.style.overflow = "";
      hero.classList.remove("hero-zooming");
      overlay.classList.remove("is-active");
    };

    const triggerZoomTransition = () => {
      if (isLocked || heroLockRef.current) {
        return;
      }
      isLocked = true;
      heroLockRef.current = true;
      hero.classList.add("hero-zooming");
      overlay.classList.add("is-active");
      overlayTimer = window.setTimeout(() => {
        const target = nextSection.offsetTop;
        const current = root.scrollTop;
        root.scrollTo({
          top: current + (target - current) * 0.75,
          behavior: "smooth",
        });
      }, 160);
      unlockTimer = window.setTimeout(releaseLock, 420);
    };

    const triggerPeek = () => {
      hero.classList.add("hero-peek");
      zoomTimer = window.setTimeout(() => {
        hero.classList.remove("hero-peek");
      }, 240);
    };

    triggerHeroZoomRef.current = triggerZoomTransition;

    const handleWheel = (event: WheelEvent) => {
      if (root.scrollTop > 2) {
        return;
      }
      if (event.deltaY > 0) {
        event.preventDefault();
        triggerZoomTransition();
        return;
      }
      if (event.deltaY < 0) {
        triggerPeek();
      }
    };

    const wheelOptions: AddEventListenerOptions = { passive: false, capture: true };
    root.addEventListener("wheel", handleWheel, wheelOptions);

    return () => {
      clearTimers();
      root.removeEventListener("wheel", handleWheel, wheelOptions);
      releaseLock();
      triggerHeroZoomRef.current = null;
      root.style.overflow = "";
    };
  }, [enableHeroTransition, heroSectionId, nextSectionId]);

  return (
    <main ref={rootRef} className="scene-root relative min-h-screen bg-black text-slate-100">
      {!disableEffects && (
        <div ref={sceneRef} className="studio-scene" aria-hidden>
          <div className="studio-base" />
          <div className="vignette" />
        </div>
      )}
      {enableHeroTransition && (
        <div ref={overlayRef} className="transition-overlay" aria-hidden>
          <div className="transition-overlay__fog" />
          <div className="transition-overlay__aberration" />
        </div>
      )}

      <div className="scene-content">
        {children}
      </div>
    </main>
  );
}
