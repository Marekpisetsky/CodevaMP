"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";

type VisualesSphereIntroProps = {
  active: boolean;
  durationMs?: number;
  onComplete: () => void;
  debug?: boolean;
};

type Star = { x: number; y: number; r: number; a: number };

type WebGLState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sphere: THREE.Mesh;
  stars: THREE.Group;
  clouds: THREE.Mesh | null;
  portalRing: THREE.Mesh;
};

type CanvasState = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  stars: Star[];
  planet: HTMLCanvasElement;
  sun: HTMLCanvasElement;
};

const createSunTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 140);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(255,245,220,0.8)");
  gradient.addColorStop(0.55, "rgba(255,190,120,0.3)");
  gradient.addColorStop(0.85, "rgba(255,140,90,0.12)");
  gradient.addColorStop(1, "rgba(255,120,80,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
};

const createFlareTexture = (radius = 120) => {
  const canvas = document.createElement("canvas");
  canvas.width = radius * 2;
  canvas.height = radius * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  gradient.addColorStop(0, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.4, "rgba(255,200,140,0.35)");
  gradient.addColorStop(0.75, "rgba(255,120,80,0.08)");
  gradient.addColorStop(1, "rgba(255,120,80,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
};

const createPlanetTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  const ocean = ctx.createRadialGradient(220, 160, 60, 256, 256, 320);
  ocean.addColorStop(0, "#1e3a8a");
  ocean.addColorStop(0.6, "#1d4ed8");
  ocean.addColorStop(1, "#0f172a");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(34, 197, 94, 0.85)";
  for (let i = 0; i < 28; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 60 + 40;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
  for (let i = 0; i < 18; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 40 + 20;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
};

const createStars = (width: number, height: number) => {
  const stars: Star[] = [];
  const count = Math.floor((width * height) / 14000);
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.2,
      a: Math.random() * 0.8 + 0.2,
    });
  }
  return stars;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function VisualesSphereIntro({
  active,
  durationMs = 5000,
  onComplete,
  debug = false,
}: VisualesSphereIntroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const completedRef = useRef(false);
  const [debugMessage, setDebugMessage] = useState("");
  const [initAttempt, setInitAttempt] = useState(0);

  useEffect(() => {
    if (!active || !portalTarget) {
      return;
    }
    if (debug) {
      setDebugMessage("init");
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (debug) {
        setDebugMessage("reduced-motion");
      }
      onComplete();
      return;
    }
    const container = containerRef.current;
    if (!container) {
      if (debug) {
        setDebugMessage("no-container");
      }
      const retryId = window.setTimeout(() => {
        setInitAttempt((value) => value + 1);
      }, 50);
      return () => {
        window.clearTimeout(retryId);
      };
    }

    let rafId = 0;
    const portalScreen = new THREE.Vector3();
    let start = performance.now();
    let webgl: WebGLState | null = null;
    let fallback: CanvasState | null = null;
    let safetyTimer = 0;
    let preoverlayTimer = 0;

    completedRef.current = false;

    const removePreoverlay = () => {
      const preoverlay = document.getElementById("visuales-preoverlay");
      if (preoverlay) {
        preoverlay.classList.add("visuales-preoverlay--fade");
        preoverlayTimer = window.setTimeout(() => {
          preoverlay.remove();
        }, 600);
      }
    };

    const cleanup = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      if (safetyTimer) {
        window.clearTimeout(safetyTimer);
      }
      if (preoverlayTimer) {
        window.clearTimeout(preoverlayTimer);
      }
      if (webgl) {
        webgl.renderer.dispose();
        webgl.renderer.domElement.remove();
        webgl = null;
      }
      if (fallback) {
        fallback.canvas.remove();
        fallback = null;
      }
    };

    const finish = () => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      removePreoverlay();
      onComplete();
      cleanup();
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (webgl) {
        webgl.renderer.setSize(width, height);
        webgl.camera.aspect = width / Math.max(1, height);
        webgl.camera.updateProjectionMatrix();
      }
      if (fallback) {
        fallback.canvas.width = width;
        fallback.canvas.height = height;
        fallback.stars = createStars(width, height);
      }
    };

    const drawFallback = (time: number) => {
      if (!fallback) {
        return;
      }
      const { canvas, ctx, stars, planet, sun } = fallback;
      const elapsed = time - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#02040a";
      ctx.fillRect(0, 0, width, height);

      for (const star of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.a})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const sunSize = Math.min(width, height) * (0.45 + eased * 0.08);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(sun, width - sunSize * 0.55, height * 0.02, sunSize, sunSize);

      const planetSize = Math.min(width, height) * (0.36 + eased * 0.22);
      const planetX = width * 0.1 - planetSize * 0.55;
      const planetY = height * 0.75 - planetSize * 0.5 - (1 - eased) * 120;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(planetX + planetSize / 2, planetY + planetSize / 2, planetSize / 2, planetSize / 2, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(planet, planetX, planetY, planetSize, planetSize);
      ctx.restore();

      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = "rgba(147, 197, 253, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(planetX + planetSize / 2, planetY + planetSize / 2, planetSize * 0.52, planetSize * 0.52, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (t > 0.78) {
        const cloudPhase = (t - 0.78) / 0.22;
        const fog = ctx.createLinearGradient(0, 0, width, height);
        fog.addColorStop(0, "rgba(255,255,255,0)");
        fog.addColorStop(0.45, "rgba(255,255,255,0.25)");
        fog.addColorStop(0.8, "rgba(255,255,255,0)");
        ctx.globalAlpha = 0.35 * cloudPhase;
        ctx.fillStyle = fog;
        ctx.fillRect(0, height * (0.24 - 0.08 * cloudPhase), width, height * 0.5);
      }

      ctx.globalAlpha = 1;
      if (canvas.style) {
        const fade = t < 0.9 ? 1 : 1 - (t - 0.9) / 0.1;
        canvas.style.opacity = fade.toFixed(3);
      }
    };

    const animate = (time: number) => {
      try {
        const elapsed = time - start;
        const t = Math.min(1, elapsed / durationMs);
        if (webgl) {
          const eased = easeOutCubic(t);
          const phase = Math.min(1, t / 0.85);
          const boost = Math.max(0, (t - 0.85) / 0.15);
          const zFar = 8.2 - phase * 2.4 - boost * 0.6;
          webgl.camera.position.z = zFar;
          webgl.camera.position.x = 0.5 - phase * 0.18;
          webgl.camera.position.y = 0.08 - phase * 0.06;
          webgl.camera.lookAt(webgl.sphere.position);
          webgl.sphere.rotation.y += 0.0007 + boost * 0.00035;
          webgl.sphere.rotation.z += 0.0002;
          if (webgl.clouds) {
            webgl.clouds.rotation.y += 0.0009 + boost * 0.00045;
            webgl.clouds.rotation.z += 0.00015;
          }
          const ringPhaseRaw = Math.min(1, Math.max(0, (t - 0.5) / 0.38));
          const ringPhase = easeOutCubic(ringPhaseRaw);
          const bounce = 1 + Math.sin(ringPhase * Math.PI) * 0.08;
          const ringScale = (0.08 + ringPhase * 3.2) * bounce;
          webgl.portalRing.scale.set(ringScale, ringScale, ringScale);
          webgl.portalRing.position.set(
            webgl.sphere.position.x,
            webgl.sphere.position.y,
            webgl.sphere.position.z + ringPhase * 5.4
          );
          webgl.portalRing.rotation.z += 0.006;
          const ringMaterial = webgl.portalRing.material as THREE.MeshBasicMaterial;
          ringMaterial.opacity = ringPhase === 0 ? 0 : 0.85 * (1 - ringPhase);
          const maxDim = Math.hypot(window.innerWidth, window.innerHeight);
          const exitPhase = Math.min(1, Math.max(0, (t - 0.92) / 0.08));
          const portalRadius = ringPhase * maxDim * 0.7 + exitPhase * maxDim * 0.9;
          portalScreen.copy(webgl.sphere.position);
          portalScreen.project(webgl.camera);
          const portalX = (portalScreen.x * 0.5 + 0.5) * window.innerWidth;
          const portalY = (-portalScreen.y * 0.5 + 0.5) * window.innerHeight;
          container.style.setProperty("--portal-x", `${portalX}px`);
          container.style.setProperty("--portal-y", `${portalY}px`);
          container.style.setProperty("--portal-r", `${portalRadius}px`);
          container.style.setProperty("--portal-o", ringPhase > 0 ? "1" : "0");
          webgl.stars.rotation.y += 0.00001;
          const fade = t < 0.9 ? 1 : 1 - (t - 0.9) / 0.1;
          webgl.renderer.domElement.style.opacity = fade.toFixed(3);
          webgl.renderer.render(webgl.scene, webgl.camera);
        } else {
          drawFallback(time);
        }

        if (t < 1) {
          rafId = window.requestAnimationFrame(animate);
        } else {
          finish();
        }
      } catch {
        finish();
      }
    };

    const initWebGL = async () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        return null;
      }
      container.dataset.webgl = "true";
      renderer.setClearColor(0x02040a, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.02;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.zIndex = "2";
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / Math.max(1, height), 0.1, 100);
      camera.position.set(1.0, 0.25, 5.6);

      const createStarPoints = (count: number, size: number, opacity: number) => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          const radius = 30 + Math.random() * 28;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = radius * Math.cos(phi);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return new THREE.Points(
          geometry,
          new THREE.PointsMaterial({
            color: 0xffffff,
            size,
            sizeAttenuation: true,
            transparent: true,
            opacity,
            depthWrite: false,
          })
        );
      };
      const stars = createStarPoints(1900, 0.045, 0.9);
      const brightStars = createStarPoints(140, 0.085, 0.8);
      const starField = new THREE.Group();
      starField.add(stars);
      starField.add(brightStars);
      scene.add(starField);

      const loader = new THREE.TextureLoader();
      let earthMap: THREE.Texture | null = null;
      let earthSpecular: THREE.Texture | null = null;
      let earthNormal: THREE.Texture | null = null;
      let earthClouds: THREE.Texture | null = null;
      let sunMap: THREE.Texture | null = null;
      let flareMap: THREE.Texture | null = null;
      try {
        const [map, specular, normal, clouds, sunTex, flareTex] = await Promise.all([
          loader.loadAsync("/space/earth_atmos_2048.jpg"),
          loader.loadAsync("/space/earth_specular_2048.jpg"),
          loader.loadAsync("/space/earth_normal_2048.jpg"),
          loader.loadAsync("/space/earth_clouds_1024.png"),
          loader.loadAsync("/space/sun_glow.png"),
          loader.loadAsync("/space/flare.png"),
        ]);
        earthMap = map;
        earthMap.colorSpace = THREE.SRGBColorSpace;
        earthSpecular = specular;
        earthNormal = normal;
        earthClouds = clouds;
        earthClouds.colorSpace = THREE.SRGBColorSpace;
        sunMap = sunTex;
        sunMap.colorSpace = THREE.SRGBColorSpace;
        flareMap = flareTex;
        flareMap.colorSpace = THREE.SRGBColorSpace;
      } catch {
        earthMap = null;
        earthSpecular = null;
        earthNormal = null;
        earthClouds = null;
        sunMap = null;
        flareMap = null;
      }

      const planetTexture = earthMap ?? new THREE.CanvasTexture(createPlanetTexture());
      if (!earthMap) {
        planetTexture.colorSpace = THREE.SRGBColorSpace;
      }
      planetTexture.minFilter = THREE.LinearFilter;
      planetTexture.magFilter = THREE.LinearFilter;
      planetTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

      const sphereMaterial = new THREE.MeshPhongMaterial({
        map: planetTexture,
        specularMap: earthSpecular ?? undefined,
        normalMap: earthNormal ?? undefined,
        shininess: 18,
        specular: new THREE.Color(0x8fb6e8),
        emissive: new THREE.Color(0x162338),
        emissiveIntensity: 0.45,
      });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.6, 64, 64), sphereMaterial);
      sphere.position.set(0, 0, 0);
      sphere.rotation.y = 0.35;
      sphere.rotation.x = 0.08;
      scene.add(sphere);

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.66, 64, 64),
        new THREE.MeshBasicMaterial({
          color: 0x89b5ff,
          transparent: true,
          opacity: 0.012,
          depthWrite: false,
        })
      );
      atmosphere.position.copy(sphere.position);
      scene.add(atmosphere);

      const sunTexture = sunMap ?? new THREE.CanvasTexture(createSunTexture());
      sunTexture.minFilter = THREE.LinearFilter;
      sunTexture.magFilter = THREE.LinearFilter;
      const coreTexture = flareMap ?? sunTexture;
      const sunCore = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: coreTexture,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      sunCore.position.set(3.2, 0.55, -2.2);
      sunCore.scale.set(1.6, 1.6, 1);
      scene.add(sunCore);

      const sunGlow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: sunTexture,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      sunGlow.position.copy(sunCore.position);
      sunGlow.scale.set(10.5, 10.5, 1);
      scene.add(sunGlow);

      const sunBloom = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: sunTexture,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      sunBloom.position.copy(sunCore.position);
      sunBloom.scale.set(16, 16, 1);
      scene.add(sunBloom);

      const flareTexture = flareMap ?? new THREE.CanvasTexture(createFlareTexture(96));
      flareTexture.minFilter = THREE.LinearFilter;
      flareTexture.magFilter = THREE.LinearFilter;
      const flarePositions = [0.25, 0.42, 0.6, 0.78];
      flarePositions.forEach((factor, index) => {
        const flare = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: flareTexture,
            transparent: true,
            opacity: 0.12 - index * 0.03,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        flare.position.set(
          sunCore.position.x - factor * 2.2,
          sunCore.position.y - factor * 0.45,
          -1.6
        );
        const size = 0.4 + index * 0.18;
        flare.scale.set(size, size, 1);
        scene.add(flare);
      });

      const light = new THREE.DirectionalLight(0xffffff, 1.2);
      light.position.set(0.5, 0.1, 3.0);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.75);
      fillLight.position.set(-0.8, -0.1, 2.2);
      scene.add(light);
      scene.add(fillLight);

      const hemi = new THREE.HemisphereLight(0xa8c8ff, 0x0b1020, 0.45);
      scene.add(hemi);
      const ambient = new THREE.AmbientLight(0x324364, 0.62);
      scene.add(ambient);

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x9fd3ff,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const portalRing = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.08, 20, 220), ringMaterial);
      portalRing.rotation.set(0, 0, 0);
      portalRing.position.set(0, 0, 6);
      portalRing.scale.set(0.2, 0.2, 0.2);
      scene.add(portalRing);

      let clouds: THREE.Mesh | null = null;
      if (earthClouds) {
        const cloudMaterial = new THREE.MeshPhongMaterial({
          map: earthClouds,
          transparent: true,
          opacity: 0.25,
          depthWrite: false,
        });
        clouds = new THREE.Mesh(new THREE.SphereGeometry(1.63, 64, 64), cloudMaterial);
        clouds.position.copy(sphere.position);
        scene.add(clouds);
      }

      return { renderer, scene, camera, sphere, stars: starField, clouds, portalRing };
    };

    const initCanvas = () => {
      const canvas = document.createElement("canvas");
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.zIndex = "2";
      container.appendChild(canvas);
      container.dataset.webgl = "false";
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return null;
      }
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      return {
        canvas,
        ctx,
        stars: createStars(canvas.width, canvas.height),
        planet: createPlanetTexture(),
        sun: createSunTexture(),
      };
    };

    const startIntro = () => {
      start = performance.now();
      rafId = window.requestAnimationFrame(animate);
      safetyTimer = window.setTimeout(finish, durationMs + 800);
      window.addEventListener("resize", handleResize);
    };

    const run = async () => {
      if (debug) {
        setDebugMessage("run");
      }
      try {
        webgl = await initWebGL();
      } catch {
        webgl = null;
      }
      if (!webgl) {
        fallback = initCanvas();
        if (!fallback) {
          if (debug) {
            setDebugMessage("no-canvas");
          }
          finish();
          return;
        }
        if (debug) {
          setDebugMessage("canvas");
        }
      } else {
        if (debug) {
          setDebugMessage("webgl");
        }
      }
      removePreoverlay();
      startIntro();
    };

    run();

    return () => {
      window.removeEventListener("resize", handleResize);
      cleanup();
    };
  }, [active, portalTarget, initAttempt, durationMs, onComplete, debug]);


  useEffect(() => {
    if (!active) {
      setPortalTarget(null);
      return;
    }
    if (typeof document === "undefined") {
      return;
    }
    setPortalTarget(document.body);
  }, [active]);

  if (!active || !portalTarget) {
    return null;
  }

  return createPortal(
    <div
      ref={containerRef}
      className="visuales-sphere-overlay visuales-sphere-overlay--active"
      aria-hidden
      data-html2canvas-ignore="true"
    >
      {debug ? <div className="visuales-sphere-debug">{debugMessage || "debug"}</div> : null}
      <div className="visuales-portal-window" aria-hidden />
      <div className="visuales-sphere-stars" />
      <div className="visuales-sphere-sun" />
      <div className="visuales-sphere-planet" />
      <div className="visuales-sphere-clouds" />
    </div>
  , portalTarget);
}
