
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Special Elite font from CDN (used to bake the logo onto a canvas texture)
const FONT_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/special-elite@5.0.8/files/special-elite-latin-400-normal.woff';
const FONT_FAMILY = '"Special Elite", "Courier New", monospace';

const LOGO_W = 1024;
const LOGO_H = 512;

// Logo plane dimensions (2:1 aspect, matches the baked texture)
const PLANE_W = 7;
const PLANE_H = 3.5;

// Number of stacked "depth" layers for the 3D extrusion effect
const DEPTH_LAYERS = [-0.06, -0.12, -0.18, -0.24];

// Ensure the Special Elite font is loaded so canvas text renders correctly.
// Falls back silently to the page's monospace font if loading fails.
async function ensureFontLoaded(): Promise<void> {
  if (typeof document === 'undefined') return;
  const fonts = document.fonts;
  if (!fonts) return;
  try {
    if (!fonts.check(`100px "Special Elite"`)) {
      const face = new FontFace('Special Elite', `url(${FONT_URL})`);
      await face.load();
      fonts.add(face);
    }
  } catch {
    // Ignore - fall back to Courier New
  }
}

// Bake a retro "goblin neon" logo (GOBLIN over GRAFIX) into a single canvas.
// This is done once and reused, so it costs almost nothing at render time.
function bakeLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = LOGO_W;
  canvas.height = LOGO_H;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, LOGO_W, LOGO_H);

  const size = 150;
  const lineHeight = 190;
  const words = [
    { text: 'GOBLIN', y: LOGO_H / 2 - lineHeight / 2 },
    { text: 'GRAFIX', y: LOGO_H / 2 + lineHeight / 2 },
  ];

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${size}px ${FONT_FAMILY}`;

  // Soft elliptical "goblin green" glow that fades out before the plane edges
  // (elliptical so it isn't clipped at the top/bottom of the canvas)
  ctx.save();
  ctx.translate(LOGO_W / 2, LOGO_H / 2);
  ctx.scale(1, LOGO_H / LOGO_W);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, LOGO_W * 0.45);
  glow.addColorStop(0, 'rgba(90, 255, 160, 0.32)');
  glow.addColorStop(0.55, 'rgba(30, 140, 90, 0.16)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-LOGO_W / 2, -LOGO_H / 2, LOGO_W, LOGO_H);
  ctx.restore();

  // Neon glow pass around the front text
  ctx.shadowColor = 'rgba(80, 255, 150, 0.9)';
  ctx.shadowBlur = 45;

  // Front text with a subtle white->green gradient
  const grad = ctx.createLinearGradient(0, words[0].y - size, 0, words[1].y + size);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#eafff2');
  grad.addColorStop(1, '#a8ffce');
  ctx.fillStyle = grad;

  for (const w of words) {
    ctx.fillText(w.text, LOGO_W / 2, w.y);
  }

  // Second pass intensifies the neon glow
  ctx.shadowBlur = 85;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (const w of words) {
    ctx.fillText(w.text, LOGO_W / 2, w.y);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// Adjusts camera distance so the logo always fits (with margin) on any screen.
const ResponsiveCamera = () => {
  const { camera, size } = useThree();

  useFrame(() => {
    const aspect = size.width / size.height;
    // Distance needed so the logo width (plus ~15% margin) fits in the viewport width
    const fitZ = (PLANE_W * 1.15) / (2 * Math.tan((45 * Math.PI) / 360) * aspect);
    const targetZ = Math.max(7, fitZ);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);
  });

  return null;
};

// The interactive 3D logo: stacked textured planes + cursor/gyro tilt + float + pulse.
const ExtrudedLogo = ({ tex, reducedMotion }: { tex: THREE.CanvasTexture; reducedMotion: boolean }) => {
  const group = useRef<THREE.Group>(null);
  const gyro = useRef({ x: 0, y: 0 });
  const pulse = useRef(0);

  // Device orientation (gyroscope) for mobile tilt
  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return;
    const handler = (e: DeviceOrientationEvent) => {
      const gamma = THREE.MathUtils.clamp(e.gamma || 0, -45, 45);
      const beta = THREE.MathUtils.clamp((e.beta || 0) - 45, -45, 45);
      gyro.current = { x: beta * 0.02, y: gamma * 0.02 };
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();

    // Cursor + gyro drive the target rotation
    const targetX = -state.pointer.y * 0.35 + gyro.current.x;
    const targetY = state.pointer.x * 0.5 + gyro.current.y;

    // Gentle idle wobble
    const wobbleX = Math.cos(t * 0.4) * 0.05;
    const wobbleY = Math.sin(t * 0.5) * 0.07;

    // Frame-rate independent smoothing factor
    const k = reducedMotion ? 0 : 1 - Math.pow(0.001, delta);

    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetX + wobbleX, k);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetY + wobbleY, k);

    if (!reducedMotion) {
      g.position.y = Math.sin(t * 0.8) * 0.12;
      g.position.x = Math.cos(t * 0.6) * 0.04;
    }

    // Click / tap pulse
    pulse.current = THREE.MathUtils.lerp(pulse.current, 0, k * 4);
    const s = 1 + pulse.current;
    g.scale.set(s, s, s);
  });

  const handlePointerDown = () => {
    pulse.current = 0.14;
  };

  // Front face is bright; back layers are tinted dark for the extruded depth.
  return (
    <group ref={group} onPointerDown={handlePointerDown}>
      {DEPTH_LAYERS.map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <planeGeometry args={[PLANE_W, PLANE_H]} />
          <meshBasicMaterial
            map={tex}
            color="#0a1f14"
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
        <meshBasicMaterial
          map={tex}
          color="#ffffff"
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

export const Masthead3D: React.FC = () => {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // Bake the logo texture once after the font is ready
  useEffect(() => {
    let cancelled = false;
    ensureFontLoaded()
      .then(() => bakeLogoTexture())
      .then((t) => {
        if (!cancelled) setTex(t);
      })
      .catch(() => {
        if (!cancelled) setTex(bakeLogoTexture());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pause rendering when the masthead scrolls offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0].isIntersecting),
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Request iOS gyroscope permission on tap
  const handlePermission = () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') console.log('Device orientation permission granted');
        })
        .catch(console.error);
    }
  };

  const frameloop = reducedMotion ? 'demand' : inView ? 'always' : 'never';

  return (
    <div
      ref={containerRef}
      className="w-full h-[60vh] md:h-screen relative overflow-hidden bg-transparent cursor-pointer"
      onClick={handlePermission}
      title="Move to tilt - tap for a pulse"
    >
      <Canvas
        dpr={[1, 2]}
        frameloop={frameloop}
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <ResponsiveCamera />
        {tex && <ExtrudedLogo tex={tex} reducedMotion={reducedMotion} />}
      </Canvas>
    </div>
  );
};
