import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const PARTICLE_COUNT = 2500;

// three shades of red assigned per particle
const RED_SHADES = ["#FF0000", "#FF4444", "#CC0000"];

function ParticleMorph() {
  const points = useRef();
  const group = useRef();

  // ── ring: full circle, slightly varied z depth ────────────────────────────
  const ringPositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 3.5 + (Math.random() - 0.5) * 0.5;
      arr[i * 3]     = Math.cos(angle) * radius;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.4;
    }
    return arr;
  }, []);

  // ── vertical helix spiral: rises along Y while orbiting ──────────────────
  const spiralPositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / PARTICLE_COUNT;
      // multiple tight orbits while climbing up Y
      const angle = t * Math.PI * 18;
      // radius stays consistent like a column, slight breathe outward at mid
      const radius = 2.8 + Math.sin(t * Math.PI) * 0.8;
      arr[i * 3]     = Math.cos(angle) * radius;
      arr[i * 3 + 1] = (t - 0.5) * 9;   // stretches from -4.5 to +4.5 on Y
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  // ── per-particle color buffer: assign one of three shades ────────────────
  const colors = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    const c = new THREE.Color();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      c.set(RED_SHADES[i % RED_SHADES.length]);
      arr[i * 3]     = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, []);

  // ── working position buffer ───────────────────────────────────────────────
  const currentPositions = useMemo(
    () => new Float32Array(ringPositions),
    [ringPositions]
  );

  // ── geometry ──────────────────────────────────────────────────────────────
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(currentPositions, 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [currentPositions, colors]);

  // ── material: vertexColors picks up the per-particle color buffer ─────────
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.05,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        vertexColors: true,
      }),
    []
  );

  // ── per-frame: morph + Y rotation ─────────────────────────────────────────
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 0 → 1 → 0 smoothly, full cycle ≈ 18s
    const factor = (Math.sin(t * 0.35) + 1) / 2;

    const pos = points.current.geometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      pos[i] = ringPositions[i] + (spiralPositions[i] - ringPositions[i]) * factor;
    }
    points.current.geometry.attributes.position.needsUpdate = true;

    group.current.rotation.y = t * 0.07;
  });

  return (
    <group ref={group}>
      <points ref={points} geometry={geometry} material={material} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <Stars
        radius={60}
        depth={40}
        count={800}
        factor={2}
        saturation={0}
        fade
        speed={0.4}
      />

      <ParticleMorph />

      <EffectComposer>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>

      <OrbitControls
        autoRotate={false}
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </>
  );
}

export default function GraphCanvas() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 2, 11], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}