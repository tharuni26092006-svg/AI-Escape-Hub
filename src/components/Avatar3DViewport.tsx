import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AvatarCustomization } from '../types';
import { AvatarMesh } from '../game/AvatarMesh';
import { BACKGROUNDS_CATALOG } from '../game/catalog';
import { RotateCcw, RotateCw, RefreshCw, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';
import { sound } from '../services/soundEngine';

interface Avatar3DViewportProps {
  avatar: AvatarCustomization;
  cameraFocus?: 'body' | 'head';
  activeEmote?: string | null;
  onFocusToggle?: () => void;
  className?: string;
}

export const Avatar3DViewport: React.FC<Avatar3DViewportProps> = ({
  avatar,
  cameraFocus = 'body',
  activeEmote = null,
  onFocusToggle,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarMeshRef = useRef<AvatarMesh | null>(null);
  const platformGroupRef = useRef<THREE.Group | null>(null);
  const reqAnimRef = useRef<number>(0);

  // Rotation & Interaction State
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [zoomOffset, setZoomOffset] = useState<number>(0); // manual zoom delta
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  const currentRotationRef = useRef<number>(0);
  const zoomOffsetRef = useRef<number>(0);
  zoomOffsetRef.current = zoomOffset;

  // Background info
  const bgData = BACKGROUNDS_CATALOG.find((b) => b.id === avatar.background);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 340;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.35, 4.2);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and shadow maps
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Lighting Rig (Roblox Studio Style 3-Point Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainKeyLight.position.set(3, 5, 4);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.bias = -0.0005;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-3, 3, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa78bfa, 0.8);
    rimLight.position.set(0, 4, -3.5);
    scene.add(rimLight);

    // Bottom soft bounce
    const groundBounce = new THREE.DirectionalLight(0xffffff, 0.3);
    groundBounce.position.set(0, -2, 2);
    scene.add(groundBounce);

    // 5. 3D Studio Pedestal Platform
    const platformGroup = new THREE.Group();
    platformGroupRef.current = platformGroup;

    // Cylindrical glossy pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.1, 1.2, 0.1, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x181a22,
      roughness: 0.35,
      metalness: 0.3,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.05;
    pedestal.receiveShadow = true;
    platformGroup.add(pedestal);

    // Glowing Neon Ring on Pedestal Edge
    const ringGeo = new THREE.RingGeometry(1.08, 1.13, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    platformGroup.add(ring);

    // Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(2.8, 2.8);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.008;
    shadowPlane.receiveShadow = true;
    platformGroup.add(shadowPlane);

    scene.add(platformGroup);

    // 6. Build Avatar Mesh (Standard scale for full-body viewport framing)
    const baseScale = 0.38;
    const avatarMesh = new AvatarMesh(avatar);
    avatarMeshRef.current = avatarMesh;
    avatarMesh.group.position.set(0, 0.01, 0);
    platformGroup.add(avatarMesh.group);

    // Apply scale & proportions
    const widthScale = avatar.width === 'slim' ? 0.9 : avatar.width === 'wide' ? 1.15 : 1.0;
    const heightScale = avatar.height === 'short' ? 0.9 : avatar.height === 'tall' ? 1.12 : 1.0;
    avatarMesh.group.scale.set(baseScale * widthScale, baseScale * heightScale, baseScale * widthScale);

    // 7. Animation Loop with smooth inertial rotation
    let clock = new THREE.Clock();
    let idleAnimTimer = 0;

    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      idleAnimTimer += delta;

      // Inertial smooth rotation
      if (!isDraggingRef.current) {
        currentRotationRef.current += (targetRotationRef.current - currentRotationRef.current) * 0.14;
        // Apply velocity decay
        if (Math.abs(velocityRef.current) > 0.001) {
          targetRotationRef.current += velocityRef.current;
          velocityRef.current *= 0.92;
        }
      } else {
        currentRotationRef.current = targetRotationRef.current;
      }

      if (platformGroupRef.current) {
        platformGroupRef.current.rotation.y = currentRotationRef.current;
      }

      // Camera Smooth Zoom & Focal tracking (Framing whole avatar or head close-up)
      // Body Center is at Y ≈ 0.98, Head Center is at Y ≈ 1.62
      const isHead = cameraFocus === 'head';
      const targetLookY = isHead ? 1.62 : 0.98;
      const targetCamY = isHead ? 1.65 : 1.05;
      const baseCamZ = isHead ? 2.2 : 3.8;
      const targetCamZ = Math.max(1.4, Math.min(6.5, baseCamZ + zoomOffsetRef.current));

      if (cameraRef.current) {
        cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.12;
        cameraRef.current.position.z += (targetCamZ - cameraRef.current.position.z) * 0.12;
        cameraRef.current.lookAt(0, targetLookY, 0);
      }

      // Subtle Breathing / Idle Avatar Sway Animation
      if (avatarMeshRef.current) {
        if (activeEmote === 'wave') {
          avatarMeshRef.current.rightArm.rotation.z = Math.sin(idleAnimTimer * 8) * 0.4 + 2.2;
          avatarMeshRef.current.rightArm.rotation.x = -0.3;
          avatarMeshRef.current.headGroup.rotation.y = Math.sin(idleAnimTimer * 4) * 0.15;
        } else if (activeEmote === 'cheer') {
          avatarMeshRef.current.leftArm.rotation.z = -2.4;
          avatarMeshRef.current.rightArm.rotation.z = 2.4;
          avatarMeshRef.current.leftArm.rotation.x = Math.sin(idleAnimTimer * 10) * 0.2;
          avatarMeshRef.current.rightArm.rotation.x = Math.sin(idleAnimTimer * 10) * 0.2;
          avatarMeshRef.current.torsoGroup.position.y = 2.7 + Math.abs(Math.sin(idleAnimTimer * 8)) * 0.15;
        } else if (activeEmote === 'dance') {
          avatarMeshRef.current.leftArm.rotation.x = Math.sin(idleAnimTimer * 6) * 0.6;
          avatarMeshRef.current.rightArm.rotation.x = -Math.sin(idleAnimTimer * 6) * 0.6;
          avatarMeshRef.current.leftLeg.rotation.x = Math.sin(idleAnimTimer * 6) * 0.4;
          avatarMeshRef.current.rightLeg.rotation.x = -Math.sin(idleAnimTimer * 6) * 0.4;
          avatarMeshRef.current.torsoGroup.position.y = 2.7 + Math.abs(Math.sin(idleAnimTimer * 12)) * 0.1;
          avatarMeshRef.current.headGroup.rotation.z = Math.sin(idleAnimTimer * 6) * 0.1;
        } else {
          // Natural idle breathing
          const breathe = Math.sin(idleAnimTimer * 2.2) * 0.015;
          avatarMeshRef.current.torsoGroup.position.y = 2.7 + breathe;
          avatarMeshRef.current.headGroup.rotation.y = Math.sin(idleAnimTimer * 0.8) * 0.04;
          avatarMeshRef.current.leftArm.rotation.z = -0.05 + Math.sin(idleAnimTimer * 2.2) * 0.02;
          avatarMeshRef.current.rightArm.rotation.z = 0.05 - Math.sin(idleAnimTimer * 2.2) * 0.02;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw === 0 || nh === 0) return;
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };

    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(container);

    return () => {
      cancelAnimationFrame(reqAnimRef.current);
      resizeObs.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update Avatar custom appearance whenever avatar prop updates
  useEffect(() => {
    if (avatarMeshRef.current) {
      avatarMeshRef.current.updateCustomization(avatar);

      // Update proportions
      const baseScale = 0.38;
      const widthScale = avatar.width === 'slim' ? 0.9 : avatar.width === 'wide' ? 1.15 : 1.0;
      const heightScale = avatar.height === 'short' ? 0.9 : avatar.height === 'tall' ? 1.12 : 1.0;
      avatarMeshRef.current.group.scale.set(baseScale * widthScale, baseScale * heightScale, baseScale * widthScale);
    }
  }, [avatar]);

  // Touch & Mouse Drag Rotation Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    velocityRef.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    const rotDelta = deltaX * 0.014;
    targetRotationRef.current += rotDelta;
    velocityRef.current = rotDelta * 0.6;
    startXRef.current = e.clientX;
    setRotationAngle(targetRotationRef.current);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomOffset((prev) => Math.max(-1.5, Math.min(2.5, prev + e.deltaY * 0.003)));
  };

  // Quick Controls
  const rotateLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playUiClick();
    targetRotationRef.current -= Math.PI / 4;
    setRotationAngle(targetRotationRef.current);
  };

  const rotateRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playUiClick();
    targetRotationRef.current += Math.PI / 4;
    setRotationAngle(targetRotationRef.current);
  };

  const resetRotation = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playUiClick();
    targetRotationRef.current = 0;
    velocityRef.current = 0;
    setZoomOffset(0);
    setRotationAngle(0);
  };

  const flip180 = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playUiClick();
    targetRotationRef.current += Math.PI;
    setRotationAngle(targetRotationRef.current);
  };

  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playUiClick();
    setZoomOffset((prev) => Math.max(-1.5, prev - 0.5));
  };

  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playUiClick();
    setZoomOffset((prev) => Math.min(2.5, prev + 0.5));
  };

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-10" />

      {/* Floating 3D Overlays matching Roblox Mobile App */}
      {/* Top Controls: Flip 180°, Focus Toggle, Zoom + / - */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={flip180}
          className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur border border-white/15 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
          title="Flip Avatar 180°"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {onFocusToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              sound.playUiClick();
              onFocusToggle();
            }}
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur border border-white/15 text-cyan-400 hover:text-cyan-300 flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
            title={cameraFocus === 'body' ? 'Focus Head / Face' : 'Full Body View'}
          >
            {cameraFocus === 'body' ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={zoomIn}
          className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur border border-white/15 text-slate-300 hover:text-white flex items-center justify-center text-base font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
          title="Zoom In"
        >
          +
        </button>

        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur border border-white/15 text-slate-300 hover:text-white flex items-center justify-center text-base font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Top-Right Background Badge */}
      <div className="absolute top-3 right-3 z-30 pointer-events-none">
        <div className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur border border-white/10 text-[10px] font-bold text-slate-300 flex items-center gap-1.5 shadow-md">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{bgData?.name || 'Studio'}</span>
        </div>
      </div>

      {/* Bottom Floating 360° Rotation Bar (Exact Roblox App Placement) */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Quick Rotate Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur px-2.5 py-1 rounded-full border border-white/15 shadow-xl pointer-events-auto">
          <button
            onClick={rotateLeft}
            className="p-1 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer"
            title="Rotate Left 45°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetRotation}
            className="px-2 text-[10px] font-black text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={rotateRight}
            className="p-1 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer"
            title="Rotate Right 45°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Swipe hint */}
        <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-[10px] text-slate-400 font-medium border border-white/5">
          Drag 360°
        </div>
      </div>
    </div>
  );
};
