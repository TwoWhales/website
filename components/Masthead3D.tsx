
/// <reference types="@react-three/fiber" />
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import { EffectComposer, ChromaticAberration, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Special Elite font from CDN (Standard WOFF format supported by the 'Text' component)
const FONT_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/special-elite@5.0.8/files/special-elite-latin-400-normal.woff';

const DynamicChromaticAberration = () => {
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (ref.current) {
      const elapsedTime = state.clock.getElapsedTime();

      // Increased intensity for better visibility on mobile
      const x = 0.005 + Math.sin(elapsedTime * 5) * 0.0004;
      const y = 0.005 + Math.sin(elapsedTime * 5 + 3) * 0.0004;

      // Create the vector
      const CAwobble = new THREE.Vector2(x, y);
      
      // Apply the vector to the offset
      ref.current.offset = CAwobble;
    }
  });

  return (
    <ChromaticAberration
      ref={ref}
      offset={[0.005, 0.005]} // Increased base offset
      radialModulation={false}
      modulationOffset={0}
    />
  );
};

// Adjusts camera position based on screen width to ensure text fits and removes perceived padding
const ResponsiveCamera = () => {
  const { camera, size } = useThree();
  
  useFrame(() => {
    const aspect = size.width / size.height;
    // If aspect is low (mobile portrait), pull camera back to fit width.
    // Standard distance is 7. Mobile needs more like 10-11 to prevent cutting off sides.
    const targetZ = aspect < 1 ? 11 : 7;
    
    // Smooth transition
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
  });
  
  return null;
};

// Helper component to create a "Fake 3D" extrusion by stacking text layers
const RetroExtrudedText = ({ text, position, size, color }: { text: string; position: [number, number, number]; size: number; color: string }) => {
  // Create an array of offsets for the "depth"
  // 8 layers for a nice chunky look
  const layers = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      z: -i * 0.02, // Depth step
      color: i === 0 ? color : '#333333', // Front face is the requested color, sides are dark
    }));
  }, [color]);

  return (
    <group position={position}>
      {layers.map((layer, index) => (
        <Text
          key={index}
          font={FONT_URL}
          fontSize={size}
          color={layer.color}
          position={[0, 0, layer.z]}
          anchorX="center"
          anchorY="middle"
          outlineWidth={index === 0 ? 0.01 : 0} // Slight outline on front face for crispness
          outlineColor="#000000"
        >
          {text}
        </Text>
      ))}
    </group>
  );
};

const FloatingText = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [gyro, setGyro] = useState({ x: 0, y: 0 });

  // Hook for device orientation (Accelerometer/Gyro effect)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Gamma is left/right tilt (-90 to 90)
      // Beta is front/back tilt (-180 to 180)
      
      // We clamp the values so the text doesn't flip completely over
      const gamma = THREE.MathUtils.clamp(e.gamma || 0, -45, 45);
      const beta = THREE.MathUtils.clamp((e.beta || 0) - 45, -45, 45); // Offset beta so "holding phone" is neutral

      // Convert to a small rotation influence
      setGyro({
        x: beta * 0.02, // Pitch
        y: gamma * 0.02 // Roll/Yaw
      });
    };

    // Check if window is defined (for SSR safety, though this is SPA)
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const { clock, pointer } = state;
      const t = clock.getElapsedTime();

      // Mouse influence
      const mouseRotY = pointer.x * 0.3; 
      const mouseRotX = -pointer.y * 0.2; 

      // Combine Mouse + Gyro
      const targetRotY = mouseRotY + gyro.y;
      const targetRotX = mouseRotX + gyro.x;

      // Base wobble
      const wobbleY = Math.sin(t * 0.5) * 0.1;
      const wobbleX = Math.cos(t * 0.3) * 0.05;

      // Smoothly interpolate
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY + wobbleY, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX + wobbleX, 0.1);
      
      // Floating motion
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Top Word: GOBLIN */}
      <RetroExtrudedText 
        text="GOBLIN" 
        position={[0, 0.6, 0]} 
        size={1.2} 
        color="#ffffff" 
      />
      
      {/* Bottom Word: GRAFIX */}
      <RetroExtrudedText 
        text="GRAFIX" 
        position={[0, -0.6, 0]} 
        size={1.2} 
        color="#ffffff" 
      />
    </group>
  );
};

export const Masthead3D: React.FC = () => {
  // Handler to request device orientation permission on iOS
  const handlePermission = () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' && 
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            console.log("Device orientation permission granted");
          }
        })
        .catch(console.error);
    }
  };

  return (
    // Added onClick to trigger permission request for iOS users
    // Reduced height on mobile (250px) to reduce empty space "padding", full height on desktop
    <div 
      className="w-full h-[250px] md:h-[400px] relative overflow-hidden bg-transparent cursor-pointer"
      onClick={handlePermission}
      title="Tap to enable motion controls"
    >
      {/* 
         Canvas is the entry point for the 3D Scene.
         dpr ensures crisp rendering on high-res screens.
      */}
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 7], fov: 45 }}>
        <ResponsiveCamera />

        {/* Lights - simplified since SDF text handles its own color mostly, but scene needs ambient */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* The 3D Content */}
        <FloatingText />

        {/* Post Processing Effects */}
        <EffectComposer enableNormalPass={false}>
            {/* Custom Chromatic Aberration with smooth wobble */}
            <DynamicChromaticAberration />
            <Bloom luminanceThreshold={0.5} intensity={0.3} levels={9} mipmapBlur />
        </EffectComposer>
        
        {/* Environment reflection mapping - subtle effect on the scene */}
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
