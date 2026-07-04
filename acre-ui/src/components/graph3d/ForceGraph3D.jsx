import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// ── mock info, keyed by node label ──────────────────────────────────────
// Each node has exactly two short lines: a "type" tag and a one-line fact.
// Swap this for real per-node data from the backend later — keep the same
// { line1, line2 } shape so nothing else needs to change.
const NODE_INFO = {
  "AMD": { line1: "Semiconductor company", line2: "Makes Ryzen & EPYC processors" },
  "Xilinx": { line1: "FPGA company", line2: "Acquired by AMD in 2022" },
  "Intel": { line1: "Semiconductor company", line2: "AMD's primary CPU competitor" },
  "NVIDIA": { line1: "GPU manufacturer", line2: "Dominant in AI accelerators" },
  "GPU": { line1: "Hardware type", line2: "Core compute for graphics & AI" },
  "CPU": { line1: "Hardware type", line2: "Handles general-purpose compute" },
  "AI": { line1: "Technology domain", line2: "Drives demand for accelerated compute" },
  "Data Center": { line1: "Infrastructure", line2: "Houses cloud & AI server hardware" },
  "Acquisition": { line1: "Business event", line2: "AMD's 2022 purchase of Xilinx" },
  "2022": { line1: "Year", line2: "AMD completed the Xilinx acquisition" },
  "FPGA": { line1: "Hardware type", line2: "Reconfigurable logic hardware" },
  "ROCm": { line1: "Software platform", line2: "AMD's open GPU compute stack" },
  "HPC": { line1: "Technology domain", line2: "Large-scale scientific computing" },
  "Cloud": { line1: "Infrastructure", line2: "On-demand remote compute resources" },
  "Inference": { line1: "AI process", line2: "Running a trained model on new data" },
};

function getInfo(label) {
  return NODE_INFO[label] || { line1: "Concept", line2: "No description available yet" };
}

// ── force simulation (runs on CPU, settles positions) ──────────────────
function useForceLayout(nodes, edges, iterations = 120) {
  return useMemo(() => {
    if (!nodes.length) return [];

    const positions = nodes.map(() => ({
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 10,
      vx: 0, vy: 0, vz: 0,
    }));

    const k  = 3.5;
    const kr = 18;
    const ks = 0.12;
    const damping = 0.85;

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dz = positions[i].z - positions[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
          const force = kr / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          const fz = (dz / dist) * force;
          positions[i].vx += fx;
          positions[i].vy += fy;
          positions[i].vz += fz;
          positions[j].vx -= fx;
          positions[j].vy -= fy;
          positions[j].vz -= fz;
        }
      }

      for (const [a, b] of edges) {
        const dx = positions[b].x - positions[a].x;
        const dy = positions[b].y - positions[a].y;
        const dz = positions[b].z - positions[a].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
        const force = (dist - k) * ks;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;
        positions[a].vx += fx;
        positions[a].vy += fy;
        positions[a].vz += fz;
        positions[b].vx -= fx;
        positions[b].vy -= fy;
        positions[b].vz -= fz;
      }

      for (const p of positions) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vx *= damping;
        p.vy *= damping;
        p.vz *= damping;
      }
    }

    return positions.map((p) => [p.x, p.y, p.z]);
  }, [nodes, edges]);
}

// ── single node ──────────────────────────────────────────────────────
function Node({ position, label, isHovered, onHover, onUnhover }) {
  const mesh = useRef();

  useFrame(({ clock }) => {
    if (isHovered) {
      mesh.current.scale.setScalar(1.4);
      return;
    }
    const t = clock.getElapsedTime();
    mesh.current.scale.setScalar(1 + 0.06 * Math.sin(t * 1.2));
  });

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onHover(); }}
        onPointerOut={onUnhover}
        visible={false}
      >
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <mesh ref={mesh}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color={isHovered ? "#FF6B6B" : "#FF0000"}
          emissive={isHovered ? "#FF6B6B" : "#FF0000"}
          emissiveIntensity={isHovered ? 1.8 : 0.8}
          roughness={0.2}
          metalness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {isHovered && (
        <Html distanceFactor={9} center>
          <div
            style={{
              background: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(255,0,0,0.5)",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 0 20px rgba(255,0,0,0.35)",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontSize: 11, color: "#FF6B6B", lineHeight: 1.5 }}>
              {getInfo(label).line1}
            </div>
            <div style={{ fontSize: 11, color: "#bbb", lineHeight: 1.5 }}>
              {getInfo(label).line2}
            </div>
          </div>
        </Html>
      )}

      {!isHovered && (
        <Html distanceFactor={14} center occlude={false}>
          <div
            style={{
              color: "#888",
              fontSize: 10,
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              marginTop: 28,
              maxWidth: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── edge line ────────────────────────────────────────────────────────
function Edge({ start, end }) {
  const ref = useRef();

  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.material.opacity = 0.08 + 0.05 * Math.sin(t * 0.7);
    }
  });

  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#FF3333" transparent opacity={0.1} />
    </line>
  );
}

// ── auto-rotate group ────────────────────────────────────────────────
function AutoRotate({ children, paused }) {
  const group = useRef();
  useFrame(() => {
    if (!paused && group.current) {
      group.current.rotation.y += 0.0018;
    }
  });
  return <group ref={group}>{children}</group>;
}

// ── scene ────────────────────────────────────────────────────────────
function Scene({ nodes, edges, positions }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { gl } = useThree();

  useEffect(() => {
    gl.domElement.style.cursor = hoveredIndex !== null ? "pointer" : "default";
  }, [hoveredIndex, gl]);

  return (
    <>
      <Stars radius={80} depth={50} count={600} factor={2} saturation={0} fade speed={0.3} />

      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} color="#FF0000" intensity={3} distance={20} />
      <pointLight position={[5, 5, 5]} color="#FF6B6B" intensity={1.5} distance={25} />
      <pointLight position={[-5, -5, -5]} color="#ffffff" intensity={0.6} distance={25} />

      <AutoRotate paused={hoveredIndex !== null}>
        {edges.map(([a, b], i) =>
          positions[a] && positions[b] ? (
            <Edge key={i} start={positions[a]} end={positions[b]} />
          ) : null
        )}

        {nodes.map((label, i) =>
          positions[i] ? (
            <Node
              key={i}
              position={positions[i]}
              label={label}
              isHovered={hoveredIndex === i}
              onHover={() => setHoveredIndex(i)}
              onUnhover={() => setHoveredIndex(null)}
            />
          ) : null
        )}
      </AutoRotate>

      <EffectComposer>
        <Bloom intensity={2.0} luminanceThreshold={0.1} luminanceSmoothing={0.9} />
      </EffectComposer>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        zoomSpeed={0.6}
        minDistance={4}
        maxDistance={30}
      />
    </>
  );
}

// ── exported canvas ──────────────────────────────────────────────────
export default function ForceGraph3D({ nodes, edges }) {
  const positions = useForceLayout(nodes, edges);

  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <Scene nodes={nodes} edges={edges} positions={positions} />
    </Canvas>
  );
}