import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const FIXED_NODES = [
  // top row — starts from very top
  { x: -14, y: 10, z: -4 }, { x: -7, y: 11, z: -5 },
  { x: 0, y: 11, z: -5 }, { x: 7, y: 11, z: -5 },
  { x: 14, y: 10, z: -4 },
  // upper mid
  { x: -12, y: 7, z: -3 }, { x: -6, y: 7, z: -3 },
  { x: 0, y: 7, z: -3 }, { x: 6, y: 7, z: -3 },
  { x: 12, y: 7, z: -3 },
  // center
  { x: -14, y: 3, z: -2 }, { x: -8, y: 3, z: -1 },
  { x: -3, y: 2, z: 0 }, { x: 3, y: 2, z: 0 },
  { x: 8, y: 3, z: -1 }, { x: 14, y: 3, z: -2 },
  // lower mid
  { x: -12, y: -2, z: -2 }, { x: -6, y: -2, z: -1 },
  { x: 0, y: -2, z: 0 }, { x: 6, y: -2, z: -1 },
  { x: 12, y: -2, z: -2 },
  // bottom row
  { x: -14, y: -6, z: -3 }, { x: -7, y: -7, z: -3 },
  { x: 0, y: -7, z: -4 }, { x: 7, y: -7, z: -3 },
  { x: 14, y: -6, z: -3 },
  // extra depth nodes
  { x: -10, y: 5, z: -5 }, { x: 10, y: 5, z: -5 },
  { x: -10, y: -4, z: -5 }, { x: 10, y: -4, z: -5 },
  { x: 0, y: 0, z: -6 },
].map((n, i) => ({
  ...n,
  id: i,
  speed: 0.1 + (i % 7) * 0.03,
  phase: (i * 1.7) % (Math.PI * 2),
  size: i < 5 ? 0.1 : i < 10 ? 0.08 : 0.06,
}));

const CONNECTION_DISTANCE = 7;

function NeuralNetwork() {
  const groupRef = useRef();
  const meshRefs = useRef([]);
  const lineRefs = useRef([]);

  const connections = useMemo(() => {
    const conns = [];
    for (let i = 0; i < FIXED_NODES.length; i++) {
      for (let j = i + 1; j < FIXED_NODES.length; j++) {
        const dx = FIXED_NODES[i].x - FIXED_NODES[j].x;
        const dy = FIXED_NODES[i].y - FIXED_NODES[j].y;
        const dz = FIXED_NODES[i].z - FIXED_NODES[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < CONNECTION_DISTANCE) {
          conns.push({ from: i, to: j });
        }
      }
    }
    return conns;
  }, []);

  const lineGeometries = useMemo(() => {
    return connections.map((conn) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(FIXED_NODES[conn.from].x, FIXED_NODES[conn.from].y, FIXED_NODES[conn.from].z),
        new THREE.Vector3(FIXED_NODES[conn.to].x, FIXED_NODES[conn.to].y, FIXED_NODES[conn.to].z),
      ]);
      return geo;
    });
  }, [connections]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const node = FIXED_NODES[i];
      const pulse = Math.sin(t * node.speed + node.phase);
      mesh.scale.setScalar(1 + pulse * 0.2);
      mesh.material.opacity = 0.6 + pulse * 0.3;
      mesh.position.x = node.x + Math.sin(t * 0.07 + node.phase) * 0.1;
      mesh.position.y = node.y + Math.cos(t * 0.09 + node.phase) * 0.08;
    });

    lineRefs.current.forEach((line, i) => {
      if (!line) return;
      const conn = connections[i];
      const pulse = Math.sin(t * 0.3 + FIXED_NODES[conn.from].phase) * 0.5 + 0.5;
      line.material.opacity = 0.04 + pulse * 0.12;
    });

    if (groupRef.current) {
      // wobble only — never goes flat
      groupRef.current.rotation.y = Math.sin(t * 0.12) * 0.15;
      groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {FIXED_NODES.map((node, i) => (
        <mesh
          key={node.id}
          ref={(el) => (meshRefs.current[i] = el)}
          position={[node.x, node.y, node.z]}
        >
          <sphereGeometry args={[node.size, 12, 12]} />
          <meshStandardMaterial
            color="#FF2200"
            emissive="#FF0000"
            emissiveIntensity={2}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      {connections.map((conn, i) => (
        <line key={i} ref={(el) => (lineRefs.current[i] = el)} geometry={lineGeometries[i]}>
          <lineBasicMaterial color="#FF3300" transparent opacity={0.1} />
        </line>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 5, 5]} intensity={0.6} color="#FF0000" />
      <Stars radius={80} depth={50} count={500} factor={2} saturation={0} fade speed={0.3} />
      <NeuralNetwork />
      <EffectComposer>
        <Bloom intensity={2.2} luminanceThreshold={0.1} luminanceSmoothing={0.9} />
      </EffectComposer>
    </>
  );
}

export default function GraphCanvas() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 65 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}