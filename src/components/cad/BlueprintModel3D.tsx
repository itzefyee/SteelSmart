'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';

type BlueprintModelType = 'gear' | 'bracket' | 'beam' | 'shaft' | 'pipe' | 'plate' | 'connector' | 'housing';
type Vector3 = [number, number, number];

interface BlueprintModel3DProps {
  modelType?: BlueprintModelType;
  className?: string;
}

function useBlueprintMotion(
  ref: RefObject<THREE.Group | null>,
  position: Vector3,
  rotationSpeed: Vector3,
  frequency: number,
  amplitude: number,
  phase = 0,
) {
  useFrame(({ clock }, delta) => {
    const group = ref.current;
    if (!group) return;

    group.rotation.x += rotationSpeed[0] * delta;
    group.rotation.y += rotationSpeed[1] * delta;
    group.rotation.z += rotationSpeed[2] * delta;
    group.position.y = position[1] + Math.sin(clock.elapsedTime * frequency + phase) * amplitude;
  });
}

function Gear({ position = [0, 0, 0] as Vector3 }: { position?: Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  useBlueprintMotion(ref, position, [0, 0, 0.3], 0.5, 0.2);

  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[1, 1, 0.3, 16, 1]} />
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function Bracket({ position = [0, 0, 0] as Vector3 }: { position?: Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, 2);
    shape.lineTo(1.5, 2);
    shape.lineTo(1.5, 1.5);
    shape.lineTo(0.5, 1.5);
    shape.lineTo(0.5, 0.5);
    shape.lineTo(1.5, 0.5);
    shape.lineTo(1.5, 0);
    shape.lineTo(0, 0);
    return new THREE.ExtrudeGeometry(shape, { steps: 1, depth: 0.3, bevelEnabled: false });
  }, []);
  useBlueprintMotion(ref, position, [0, 0.48, 0], 0.6, 0.15, 1);

  return (
    <group ref={ref} position={position}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Beam({ position = [0, 0, 0] as Vector3 }: { position?: Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  useBlueprintMotion(ref, position, [0.18, 0.36, 0], 0.4, 0.18, 2);

  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2, 0.2, 0.4]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.75} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.2, 1.6, 0.4]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, -0.8, 0]}>
        <boxGeometry args={[2, 0.2, 0.4]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function Shaft({ position = [0, 0, 0] as Vector3 }: { position?: Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  useBlueprintMotion(ref, position, [0.6, 0, 0], 0.7, 0.12, 3);

  return (
    <group ref={ref} position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 2.5, 16, 1]} />
        <meshBasicMaterial color="#1d4ed8" wireframe transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function Pipe({ position = [0, 0, 0] as Vector3 }: { position?: Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  useBlueprintMotion(ref, position, [0, 0.42, 0], 0.55, 0.16, 4);

  return (
    <group ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 2, 16, 1]} />
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.75} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 2.1, 16, 1]} />
        <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function Plate({ position = [0, 0, 0] as Vector3 }: { position?: Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  useBlueprintMotion(ref, position, [0, 0, 0.24], 0.45, 0.14, 5);

  return (
    <group ref={ref} position={position}>
      <mesh>
        <boxGeometry args={[2, 0.2, 1.5]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Connector({ position = [0, 0, 0] as Vector3 }: { position?: Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  useBlueprintMotion(ref, position, [0.3, 0.54, 0], 0.5, 0.17, 6);

  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
        <meshBasicMaterial color="#1d4ed8" wireframe transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 1.2, 16]} />
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function Housing({ position = [0, 0, 0] as Vector3 }: { position?: Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  useBlueprintMotion(ref, position, [0, 0.36, 0], 0.48, 0.15, 7);

  return (
    <group ref={ref} position={position}>
      <mesh>
        <boxGeometry args={[1.8, 1.8, 1.2]} />
        <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[1.9, 0.15, 1.3]} />
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.65} />
      </mesh>
      <mesh position={[0.95, 0, 0]}>
        <boxGeometry args={[0.1, 1.6, 1.1]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function Scene({ modelType }: { modelType: BlueprintModelType }) {
  const configurations: Record<BlueprintModelType, ReactNode> = {
    gear: <><Gear /><Gear position={[-2.5, 0.5, -1]} /><Shaft position={[2, -0.5, 1]} /></>,
    bracket: <><Bracket /><Bracket position={[-2, 0.3, -0.5]} /><Gear position={[2, -0.2, 0.5]} /></>,
    beam: <><Beam /><Bracket position={[-2.5, 0.5, -1]} /><Shaft position={[2.5, -0.3, 1]} /></>,
    shaft: <><Shaft /><Gear position={[-2, 0.4, -1]} /><Gear position={[2, -0.4, 1]} /></>,
    pipe: <><Pipe /><Connector position={[-2, 0.3, -1]} /><Plate position={[2, -0.3, 1]} /></>,
    plate: <><Plate /><Bracket position={[-2.2, 0.4, -0.8]} /><Shaft position={[2.2, -0.4, 0.8]} /></>,
    connector: <><Connector /><Pipe position={[-2.5, 0.5, -1]} /><Gear position={[2.5, -0.5, 1]} /></>,
    housing: <><Housing /><Beam position={[-2.3, 0.4, -1]} /><Bracket position={[2.3, -0.4, 1]} /></>,
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={50} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      {configurations[modelType]}
    </>
  );
}

export default function BlueprintModel3D({ modelType = 'gear', className = '' }: BlueprintModel3DProps) {
  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene modelType={modelType} />
        </Suspense>
      </Canvas>
    </div>
  );
}
