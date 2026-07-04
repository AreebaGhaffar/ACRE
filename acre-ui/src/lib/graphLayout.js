// Simple force-directed layout: repels all nodes from each other,
// attracts connected nodes together, runs a fixed number of iterations,
// then returns final {id, name, x, y, z} positions.
//
// This runs once (not every frame) — call it when data loads, not in useFrame.

export function computeGraphLayout(nodes, edges, iterations = 300) {
  const n = nodes.length;

  const positions = nodes.map(() => ({
    x: (Math.random() - 0.5) * 8,
    y: (Math.random() - 0.5) * 8,
    z: (Math.random() - 0.5) * 8,
  }));

  const idToIndex = {};
  nodes.forEach((node, i) => (idToIndex[node.id] = i));

  const edgeIndexPairs = edges
    .map(([a, b]) => [idToIndex[a], idToIndex[b]])
    .filter(([a, b]) => a !== undefined && b !== undefined);

  const REPULSION = 2.2;
  const ATTRACTION = 0.06;
  const DAMPING = 0.9;
  const CENTER_PULL = 0.01;

  let velocities = positions.map(() => ({ x: 0, y: 0, z: 0 }));

  for (let iter = 0; iter < iterations; iter++) {
    const forces = positions.map(() => ({ x: 0, y: 0, z: 0 }));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dz = positions[i].z - positions[j].z;
        const distSq = dx * dx + dy * dy + dz * dz + 0.01;
        const dist = Math.sqrt(distSq);
        const force = REPULSION / distSq;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        forces[i].x += fx;
        forces[i].y += fy;
        forces[i].z += fz;
        forces[j].x -= fx;
        forces[j].y -= fy;
        forces[j].z -= fz;
      }
    }

    edgeIndexPairs.forEach(([a, b]) => {
      const dx = positions[b].x - positions[a].x;
      const dy = positions[b].y - positions[a].y;
      const dz = positions[b].z - positions[a].z;

      forces[a].x += dx * ATTRACTION;
      forces[a].y += dy * ATTRACTION;
      forces[a].z += dz * ATTRACTION;
      forces[b].x -= dx * ATTRACTION;
      forces[b].y -= dy * ATTRACTION;
      forces[b].z -= dz * ATTRACTION;
    });

    for (let i = 0; i < n; i++) {
      forces[i].x -= positions[i].x * CENTER_PULL;
      forces[i].y -= positions[i].y * CENTER_PULL;
      forces[i].z -= positions[i].z * CENTER_PULL;
    }

    for (let i = 0; i < n; i++) {
      velocities[i].x = (velocities[i].x + forces[i].x) * DAMPING;
      velocities[i].y = (velocities[i].y + forces[i].y) * DAMPING;
      velocities[i].z = (velocities[i].z + forces[i].z) * DAMPING;

      positions[i].x += velocities[i].x;
      positions[i].y += velocities[i].y;
      positions[i].z += velocities[i].z;
    }
  }

  return nodes.map((node, i) => ({
    ...node,
    x: positions[i].x,
    y: positions[i].y,
    z: positions[i].z,
  }));
}