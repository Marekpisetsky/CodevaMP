"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type CabinaSceneProps = {
  className?: string;
  connected?: boolean;
  partnerLabel?: string;
};

export default function CabinaScene({ className, connected = false, partnerLabel }: CabinaSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [hudHint, setHudHint] = useState("Click para entrar en la cabina");
  const [appearanceMode, setAppearanceMode] = useState(false);
  const [appearance, setAppearance] = useState({
    suit: "Blanco puro",
    visor: "Transparente",
    accent: "Neon suave",
  });
  const [heightCm, setHeightCm] = useState(170);
  const [matrixMode, setMatrixMode] = useState(true);
  const appearanceRef = useRef(false);
  const appearanceStateRef = useRef(appearance);
  const heightRef = useRef(heightCm);
  const nearBoothRef = useRef(false);
  const matrixRef = useRef(matrixMode);
  const nearPaperRef = useRef(false);
  const pendingLockRef = useRef(false);
  const teleportRef = useRef<THREE.Vector3 | null>(null);
  const entryPositionRef = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    appearanceRef.current = appearanceMode;
    if (appearanceMode && document.pointerLockElement) {
      document.exitPointerLock();
      setLocked(false);
    }
  }, [appearanceMode]);

  useEffect(() => {
    matrixRef.current = matrixMode;
    if (matrixMode && document.pointerLockElement) {
      document.exitPointerLock();
      setLocked(false);
    }
  }, [matrixMode]);

  useEffect(() => {
    appearanceStateRef.current = appearance;
  }, [appearance]);

  useEffect(() => {
    heightRef.current = heightCm;
  }, [heightCm]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("cabina-appearance");
      if (saved) {
        const parsed = JSON.parse(saved) as { suit: string; visor: string; accent: string; heightCm: number };
        setAppearance({ suit: parsed.suit, visor: parsed.visor, accent: parsed.accent });
        setHeightCm(parsed.heightCm ?? 170);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "cabina-appearance",
        JSON.stringify({ ...appearance, heightCm })
      );
    } catch {
      // ignore
    }
  }, [appearance, heightCm]);
  const connectedRef = useRef(connected);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");

    const baseFov = 42;
    const camera = new THREE.PerspectiveCamera(baseFov, 1, 0.1, 120);
    camera.position.set(0, 1.7, 8.6);
    camera.rotation.order = "YXZ";

    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.1));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Perf panel removed.

    const ambient = new THREE.AmbientLight("#ffffff", isMobile ? 0.95 : 1);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight("#ffffff", isMobile ? 0.15 : 0.2);
    keyLight.position.set(6, 10, 6);
    scene.add(keyLight);

    const roomSize = 22;
    const wallHeight = 10;
    const halfRoom = roomSize / 2;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomSize),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85, metalness: 0.02 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.95,
      metalness: 0,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.35,
    });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMaterial);
    backWall.position.set(0, wallHeight / 2, -halfRoom);
    scene.add(backWall);
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMaterial);
    frontWall.position.set(0, wallHeight / 2, halfRoom);
    frontWall.rotation.y = Math.PI;
    scene.add(frontWall);
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMaterial);
    leftWall.position.set(-halfRoom, wallHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMaterial);
    rightWall.position.set(halfRoom, wallHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: "#e2e8f0", roughness: 0.4, metalness: 0.2 });
    const windowGlowMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.9,
      roughness: 0.15,
    });
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 0.2), windowFrameMaterial);
    windowFrame.position.set(0, 5.4, -halfRoom + 0.11);
    scene.add(windowFrame);
    const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.6), windowGlowMaterial);
    windowGlass.position.set(0, 5.4, -halfRoom + 0.22);
    scene.add(windowGlass);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, roomSize),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95 })
    );
    ceiling.position.y = wallHeight;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    const table = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.6, 6.6),
      new THREE.MeshStandardMaterial({
        color: "#fdf5f7",
        roughness: 0.55,
        metalness: 0.08,
        emissive: new THREE.Color("#f8e8ee"),
        emissiveIntensity: 0.06,
      })
    );
    table.position.set(0, 0.6, -1.6);
    scene.add(table);

    const tableGlow = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 0.08, 6.8),
      new THREE.MeshStandardMaterial({
        color: "#f7d8e2",
        emissive: new THREE.Color("#f7d8e2"),
        emissiveIntensity: 0.1,
        roughness: 0.45,
      })
    );
    tableGlow.position.set(0, 0.98, -1.6);
    scene.add(tableGlow);

    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.2),
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.5,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.35,
      })
    );
    paper.position.set(0, 0.93, -1.6);
    paper.rotation.x = -Math.PI / 2;
    scene.add(paper);

    const makePaperButton = (text: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return null;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(15, 23, 42, 0.18)";
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 52px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return new THREE.Mesh(
        new THREE.PlaneGeometry(0.85, 0.26),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4, transparent: true })
      );
    };

    const paperButton = makePaperButton("Salir de la matrix");
    if (paperButton) {
      paperButton.position.set(0, 0.94, -1.6);
      paperButton.rotation.x = -Math.PI / 2;
      scene.add(paperButton);
    }

    const pencilMaterial = new THREE.MeshStandardMaterial({ color: "#f97316", roughness: 0.35 });
    const pencilWood = new THREE.MeshStandardMaterial({ color: "#f8d28d", roughness: 0.45 });
    const pencilGraphite = new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.2 });
    const pencilBody = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 16), pencilMaterial);
    pencilBody.position.set(-0.7, 0.96, 0.8);
    pencilBody.rotation.z = Math.PI / 2;
    pencilBody.rotation.y = Math.PI / 8;
    scene.add(pencilBody);
    const pencilTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 16), pencilWood);
    pencilTip.position.set(-1.3, 0.96, 0.8);
    pencilTip.rotation.z = Math.PI / 2;
    pencilTip.rotation.y = Math.PI / 8;
    scene.add(pencilTip);
    const pencilLead = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 12), pencilGraphite);
    pencilLead.position.set(-1.36, 0.96, 0.8);
    pencilLead.rotation.z = Math.PI / 2;
    pencilLead.rotation.y = Math.PI / 8;
    scene.add(pencilLead);
    const pencilBody2 = pencilBody.clone();
    pencilBody2.position.set(-0.55, 0.97, 1.35);
    pencilBody2.rotation.y = -Math.PI / 10;
    scene.add(pencilBody2);
    const pencilBody3 = pencilBody.clone();
    pencilBody3.position.set(0.75, 0.97, 0.9);
    pencilBody3.rotation.y = Math.PI / 12;
    scene.add(pencilBody3);

    const cornerPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.6),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.55 })
    );
    cornerPaper.position.set(1.6, 0.93, -2.4);
    cornerPaper.rotation.x = -Math.PI / 2;
    cornerPaper.rotation.z = Math.PI / 18;
    scene.add(cornerPaper);

    const boothGroup = new THREE.Group();
    const boothMaterial = new THREE.MeshStandardMaterial({
      color: "#f8fafc",
      roughness: 0.35,
      metalness: 0.05,
      emissive: new THREE.Color("#f8fafc"),
      emissiveIntensity: 0.12,
      side: THREE.DoubleSide,
    });
    const boothAccent = new THREE.MeshStandardMaterial({
      color: "#cbd5f5",
      roughness: 0.25,
      metalness: 0.12,
      emissive: new THREE.Color("#e0e7ff"),
      emissiveIntensity: 0.16,
    });
    const boothBase = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.22, 32), boothMaterial);
    boothBase.position.set(-7.2, 0.11, -8.6);
    boothGroup.add(boothBase);
    const boothFloor = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.1, 28), boothAccent);
    boothFloor.position.set(-7.2, 0.18, -8.6);
    boothGroup.add(boothFloor);
    scene.add(boothGroup);

    const plateBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: "#e2e8f0", roughness: 0.6, metalness: 0.2 })
    );
    plateBase.position.set(-5.4, 0.45, -7.0);
    scene.add(plateBase);
    const plateTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.08, 0.45),
      new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.3,
        metalness: 0.4,
      })
    );
    plateTop.position.set(-5.4, 0.95, -7.0);
    scene.add(plateTop);

    const makePlateLabel = (text: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(18, 18, 92, 92);
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 6;
      ctx.strokeRect(18, 18, 92, 92);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 62px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(0.45, 0.45, 1);
      return sprite;
    };

    const plateLabel = makePlateLabel("E");
    if (plateLabel) {
      plateLabel.position.set(-5.4, 1.2, -7.0);
      plateLabel.visible = false;
      scene.add(plateLabel);
    }
    const paperLabel = makePlateLabel("E");
    if (paperLabel) {
      paperLabel.position.set(0, 1.25, 1.1);
      paperLabel.visible = false;
      scene.add(paperLabel);
    }

    // Height meter now lives inside the appearance UI.

    const avatarGroup = new THREE.Group();
    const avatarMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.4, metalness: 0.1 });
    const avatarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16), avatarMaterial);
    avatarBody.position.set(0, 0.6, 0);
    avatarGroup.add(avatarBody);
    const avatarHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), avatarMaterial);
    avatarHead.position.set(0, 1.35, 0);
    avatarGroup.add(avatarHead);
    const avatarTorso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.35), avatarMaterial);
    avatarTorso.position.set(0, 0.95, 0);
    avatarGroup.add(avatarTorso);
    const armGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12);
    const avatarArmLeft = new THREE.Mesh(armGeometry, avatarMaterial);
    avatarArmLeft.position.set(-0.45, 0.95, 0);
    avatarArmLeft.rotation.z = Math.PI / 14;
    avatarGroup.add(avatarArmLeft);
    const avatarArmRight = avatarArmLeft.clone();
    avatarArmRight.position.set(0.45, 0.95, 0);
    avatarArmRight.rotation.z = -Math.PI / 14;
    avatarGroup.add(avatarArmRight);
    const legGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.8, 12);
    const avatarLegLeft = new THREE.Mesh(legGeometry, avatarMaterial);
    avatarLegLeft.position.set(-0.18, 0.2, 0);
    avatarGroup.add(avatarLegLeft);
    const avatarLegRight = avatarLegLeft.clone();
    avatarLegRight.position.set(0.18, 0.2, 0);
    avatarGroup.add(avatarLegRight);
    avatarGroup.visible = false;
    scene.add(avatarGroup);

    // Mirror removed for a cleaner, calm space.

    // Valve removed with central cabina.

    const partnerCabina = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 3),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.2, metalness: 0.05 })
    );
    partnerCabina.position.set(0, 1.5, -9.6);
    partnerCabina.visible = false;
    scene.add(partnerCabina);

    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 4, 14),
      new THREE.MeshStandardMaterial({ color: "#cbd5f5", roughness: 0.5 })
    );
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(0, 1.1, -6.4);
    pipe.visible = false;
    scene.add(pipe);

    const colliderPadding = new THREE.Vector3(0.1, 0.1, 0.1);
    const colliders = [
      { mesh: table, box: new THREE.Box3(), allowTop: true },
      { mesh: partnerCabina, box: new THREE.Box3(), allowTop: false },
    ];
    const playerRadius = 0.35;
    const playerHeight = 1.7;

    let yaw = 0;
    let pitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let verticalVelocity = 0;
    let grounded = true;
    const eyeHeight = 1.7;
    const playerPos = new THREE.Vector3(camera.position.x, eyeHeight, camera.position.z);
    const keys = new Set<string>();
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();

    const syncCameraToCanvas = () => {
      if (!container) {
        return;
      }
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const onResize = () => {
      if (!container) {
        return;
      }
      syncCameraToCanvas();
    };

    syncCameraToCanvas();

    const onMouseMove = (event: MouseEvent) => {
      if (!document.pointerLockElement) {
        return;
      }
      const sensitivity = 0.0014;
      targetYaw -= event.movementX * sensitivity;
      targetPitch -= event.movementY * sensitivity;
      targetPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, targetPitch));
    };

    const exitAppearance = () => {
      appearanceRef.current = false;
      setAppearanceMode(false);
      setHudHint(locked ? "WASD para moverte - Mouse para mirar" : "Click para entrar en la cabina");
      teleportRef.current = boothPosition.clone();
      targetYaw = -Math.PI / 2;
      targetPitch = 0;
      yaw = targetYaw;
      pitch = targetPitch;
      pendingLockRef.current = true;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keys.add(key);
      if (pendingLockRef.current && !appearanceRef.current && !matrixRef.current && key !== "escape") {
        renderer.domElement.requestPointerLock();
        pendingLockRef.current = false;
      }
      if (key === "escape" && appearanceRef.current) {
        return;
      }
      if (key === "e" && nearBoothRef.current) {
        if (appearanceRef.current) {
          exitAppearance();
          renderer.domElement.requestPointerLock();
        } else {
          setMatrixMode(false);
          setAppearanceMode(true);
          setHudHint("Modo apariencia - E para salir");
          entryPositionRef.current = camera.position.clone();
          teleportRef.current = new THREE.Vector3(-7.2, eyeHeight, -8.6);
          targetYaw = Math.PI / 2;
        }
        return;
      }
      if (key === "e" && nearPaperRef.current && !appearanceRef.current) {
        setMatrixMode(true);
        setHudHint("Click para entrar en la cabina");
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.key.toLowerCase());
    };

    const onPointerLockChange = () => {
      setLocked(Boolean(document.pointerLockElement));
      camera.fov = baseFov;
      camera.updateProjectionMatrix();
    };

    const onPointerLockError = () => {
      setLocked(false);
    };

    const requestLock = () => {
      if (appearanceRef.current || matrixRef.current) {
        return;
      }
      renderer.domElement.requestPointerLock();
    };

    renderer.domElement.addEventListener("click", requestLock);
    window.addEventListener("resize", onResize);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("pointerlockerror", onPointerLockError);

    let lastNearState = false;
    const boothPosition = new THREE.Vector3(-7.2, eyeHeight, -8.6);
    let paused = false;
    const handleVisibility = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const animate = () => {
      if (paused) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }
      const delta = Math.min(clock.getDelta(), 0.05);
      const speed = keys.has("shift") ? 5.5 : 3.2;

      if (!appearanceRef.current && !matrixRef.current && keys.has(" ") && grounded) {
        verticalVelocity = 6.6;
        grounded = false;
      }

      direction.set(0, 0, 0);
      if (!appearanceRef.current && !matrixRef.current) {
        if (keys.has("w")) direction.z -= 1;
        if (keys.has("s")) direction.z += 1;
        if (keys.has("a")) direction.x -= 1;
        if (keys.has("d")) direction.x += 1;
      }
      direction.normalize();

      if (!appearanceRef.current && !matrixRef.current && direction.lengthSq() > 0) {
        const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        const right = new THREE.Vector3(forward.z, 0, -forward.x);
        velocity.copy(forward).multiplyScalar(direction.z);
        velocity.add(right.multiplyScalar(direction.x));
        velocity.normalize().multiplyScalar(speed * delta);
        const nextPosition = camera.position.clone().add(velocity);
        const canMoveTo = (pos: THREE.Vector3) => {
          const playerBox = new THREE.Box3(
            new THREE.Vector3(pos.x - playerRadius, pos.y - playerHeight, pos.z - playerRadius),
            new THREE.Vector3(pos.x + playerRadius, pos.y, pos.z + playerRadius)
          );
          for (const collider of colliders) {
            if (!collider.mesh.visible) {
              continue;
            }
            collider.box.setFromObject(collider.mesh).expandByVector(colliderPadding);
            if (collider.box.intersectsBox(playerBox)) {
              if (collider.allowTop) {
                const feetY = pos.y - playerHeight;
                if (feetY >= collider.box.max.y - 0.05) {
                  continue;
                }
              }
              return false;
            }
          }
          return true;
        };

        if (canMoveTo(nextPosition)) {
          camera.position.copy(nextPosition);
        } else {
          const slideX = new THREE.Vector3(nextPosition.x, camera.position.y, camera.position.z);
          const slideZ = new THREE.Vector3(camera.position.x, camera.position.y, nextPosition.z);
          if (canMoveTo(slideX)) {
            camera.position.copy(slideX);
          } else if (canMoveTo(slideZ)) {
            camera.position.copy(slideZ);
          }
        }
      }

      if (appearanceRef.current || matrixRef.current) {
        verticalVelocity = 0;
      } else {
        verticalVelocity += -18 * delta;
      }
      let nextY = camera.position.y + verticalVelocity * delta;
      let groundedHeight = eyeHeight;
      for (const collider of colliders) {
        if (!collider.mesh.visible || !collider.allowTop) {
          continue;
        }
        collider.box.setFromObject(collider.mesh).expandByVector(colliderPadding);
        const feetX = camera.position.x;
        const feetZ = camera.position.z;
        const withinXZ =
          feetX >= collider.box.min.x - playerRadius &&
          feetX <= collider.box.max.x + playerRadius &&
          feetZ >= collider.box.min.z - playerRadius &&
          feetZ <= collider.box.max.z + playerRadius;
        if (!withinXZ) {
          continue;
        }
        const topHeight = collider.box.max.y + playerHeight;
        if (topHeight > groundedHeight) {
          groundedHeight = topHeight;
        }
      }
      if (nextY <= groundedHeight) {
        nextY = groundedHeight;
        verticalVelocity = 0;
        grounded = true;
      } else {
        grounded = false;
      }
      camera.position.y = nextY;

      const limit = halfRoom - 0.6;
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -limit, limit);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -limit, limit);

      yaw = targetYaw;
      pitch = targetPitch;

      if (teleportRef.current) {
        const target = teleportRef.current;
        camera.position.set(target.x, target.y, target.z);
        teleportRef.current = null;
        verticalVelocity = 0;
        grounded = true;
      }

      playerPos.set(camera.position.x, camera.position.y, camera.position.z);

      if (matrixRef.current) {
        camera.position.set(0, 2.2, -4.2);
        camera.lookAt(0, 0.9, -1.6);
        camera.rotation.z = 0;
        avatarGroup.visible = false;
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hits = raycaster.intersectObject(table, false);
        if (hits.length > 0) {
          const hit = hits[0].point;
          paper.position.set(hit.x, hit.y + 0.03, hit.z);
          if (paperButton) {
            paperButton.position.set(hit.x, hit.y + 0.035, hit.z);
          }
        }
      } else if (appearanceRef.current) {
        playerPos.copy(boothPosition);
        const boothCenter = new THREE.Vector3(boothPosition.x, boothPosition.y + 0.4, boothPosition.z);
        camera.position.set(boothCenter.x + 5.0, boothCenter.y, boothCenter.z);
        camera.lookAt(boothCenter);
        avatarGroup.visible = true;
        avatarGroup.position.set(playerPos.x, playerPos.y - eyeHeight + 1.0, playerPos.z);
        avatarGroup.rotation.y = Math.atan2(
          camera.position.x - playerPos.x,
          camera.position.z - playerPos.z
        );
        const currentAppearance = appearanceStateRef.current;
        const suitColor =
          currentAppearance.suit === "Marfil"
            ? "#f6f1e6"
            : currentAppearance.suit === "Gris humo"
              ? "#c7cdd6"
              : "#ffffff";
        const accentColor =
          currentAppearance.accent === "Cian"
            ? "#22d3ee"
            : currentAppearance.accent === "Coral"
              ? "#fb7185"
              : "#9ff1ff";
        avatarMaterial.color.set(suitColor);
        avatarMaterial.emissive.set(accentColor);
        avatarMaterial.emissiveIntensity =
          currentAppearance.visor === "Azul tenue"
            ? 0.18
            : currentAppearance.visor === "Oro suave"
              ? 0.22
              : 0.08;
        avatarMaterial.roughness = currentAppearance.visor === "Oro suave" ? 0.2 : 0.35;
        const heightScale = THREE.MathUtils.clamp(heightRef.current / 170, 0.85, 1.2);
        avatarGroup.scale.set(1, heightScale, 1);
      } else {
        camera.rotation.set(pitch, yaw, 0);
        avatarGroup.visible = false;
      }

      const nearBooth = camera.position.distanceTo(boothPosition) < 5.2;
      if (!appearanceRef.current && !matrixRef.current) {
        nearBoothRef.current = nearBooth;
        if (plateLabel) {
          plateLabel.visible = nearBooth;
        }
        if (nearBooth !== lastNearState) {
          lastNearState = nearBooth;
          if (nearBooth) {
            setHudHint("Pulsa E para entrar a la cabina");
          } else {
            setHudHint(locked ? "WASD para moverte - Mouse para mirar" : "Click para entrar en la cabina");
          }
        }
      } else if (plateLabel) {
        plateLabel.visible = false;
      }

      const nearPaper = camera.position.distanceTo(paper.position) < 2.6;
      if (!appearanceRef.current && !matrixRef.current) {
        nearPaperRef.current = nearPaper;
        if (paperLabel) {
          paperLabel.visible = nearPaper && !nearBooth;
        }
        if (nearPaper && !nearBooth) {
          setHudHint("Pulsa E para abrir la mesa");
        }
      } else if (paperLabel) {
        paperLabel.visible = false;
      }

      const targetZ = connectedRef.current ? -7.8 : -10.5;
      partnerCabina.position.z = THREE.MathUtils.lerp(partnerCabina.position.z, targetZ, 0.08);
      partnerCabina.visible = connectedRef.current;
      pipe.visible = connectedRef.current;

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      renderer.domElement.removeEventListener("click", requestLock);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("pointerlockerror", onPointerLockError);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      renderer.dispose();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      container.removeChild(renderer.domElement);
      // Perf panel removed.
    };
  }, []);

  return (
    <div className={className}>
      <div className="cabina-3d" ref={containerRef} />
      {!matrixMode ? (
        <div className="cabina-3d__hud">
          <span>{hudHint}</span>
          <span>Esc para salir</span>
          {appearanceMode ? <span>Modo apariencia activo</span> : null}
          {connected && partnerLabel ? <span>Conectado con {partnerLabel}</span> : null}
        </div>
      ) : null}
      {appearanceMode && !matrixMode ? (
        <div className="cabina-appearance">
          <div className="cabina-appearance__header">
            <h3>Cabina de apariencia</h3>
            <span>Perfil inicial</span>
          </div>
          <div className="cabina-appearance__meter">
            <p>Estatura</p>
            <div>
              <input
                type="range"
                min={140}
                max={210}
                value={heightCm}
                onChange={(event) => setHeightCm(Number(event.target.value))}
              />
              <span>{Math.floor(heightCm / 100)}.{String(heightCm % 100).padStart(2, "0")} m</span>
            </div>
          </div>
          <div className="cabina-appearance__rows">
            <div>
              <p>Traje</p>
              <button
                type="button"
                className={appearance.suit === "Blanco puro" ? "active" : ""}
                onClick={() => setAppearance((prev) => ({ ...prev, suit: "Blanco puro" }))}
              >
                Blanco puro
              </button>
              <button
                type="button"
                className={appearance.suit === "Marfil" ? "active" : ""}
                onClick={() => setAppearance((prev) => ({ ...prev, suit: "Marfil" }))}
              >
                Marfil
              </button>
              <button
                type="button"
                className={appearance.suit === "Gris humo" ? "active" : ""}
                onClick={() => setAppearance((prev) => ({ ...prev, suit: "Gris humo" }))}
              >
                Gris humo
              </button>
            </div>
            <div>
              <p>Visor</p>
              <button
                type="button"
                className={appearance.visor === "Transparente" ? "active" : ""}
                onClick={() => setAppearance((prev) => ({ ...prev, visor: "Transparente" }))}
              >
                Transparente
              </button>
              <button
                type="button"
                className={appearance.visor === "Azul tenue" ? "active" : ""}
                onClick={() => setAppearance((prev) => ({ ...prev, visor: "Azul tenue" }))}
              >
                Azul tenue
              </button>
              <button
                type="button"
                className={appearance.visor === "Oro suave" ? "active" : ""}
                onClick={() => setAppearance((prev) => ({ ...prev, visor: "Oro suave" }))}
              >
                Oro suave
              </button>
            </div>
            <div>
              <p>Acento</p>
              <button
                type="button"
                className={appearance.accent === "Neon suave" ? "active" : ""}
                onClick={() => setAppearance((prev) => ({ ...prev, accent: "Neon suave" }))}
              >
                Neon suave
              </button>
              <button
                type="button"
                className={appearance.accent === "Cian" ? "active" : ""}
                onClick={() => setAppearance((prev) => ({ ...prev, accent: "Cian" }))}
              >
                Cian
              </button>
              <button
                type="button"
                className={appearance.accent === "Coral" ? "active" : ""}
                onClick={() => setAppearance((prev) => ({ ...prev, accent: "Coral" }))}
              >
                Coral
              </button>
            </div>
          </div>
          <div className="cabina-appearance__summary">
            <span>Estatura: {heightCm} cm</span>
            <span>Traje: {appearance.suit}</span>
            <span>Visor: {appearance.visor}</span>
            <span>Acento: {appearance.accent}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

