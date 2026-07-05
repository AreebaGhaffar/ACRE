import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getGraphStats } from "../../api/acre";
import ForceGraph3D from "../graph3d/ForceGraph3D";
import { mockGraphData } from "../../lib/mockData";
import { computeGraphLayout } from "../../lib/graphLayout";
// mock data for when backend isn't running
const MOCK_NODES = [
  "AMD", "Xilinx", "Intel", "NVIDIA", "GPU",
  "CPU", "AI", "Data Center", "Acquisition", "2022",
  "FPGA", "ROCm", "HPC", "Cloud", "Inference",
];

const MOCK_EDGES = [
  [0,1],[0,2],[0,3],[0,4],[0,5],
  [0,6],[0,7],[1,11],[1,10],[2,4],
  [3,4],[3,6],[4,6],[5,6],[6,7],
  [7,13],[8,0],[9,1],[10,12],[11,13],
  [12,14],[13,14],[6,14],
];

function buildEdges(nodes) {
  const edges = [];
  const seen = new Set();
  for (let i = 0; i < nodes.length; i++) {
    // connect to 2 nearest neighbors
    for (let j = 1; j <= 2; j++) {
      const target = (i + j) % nodes.length;
      const key = `${Math.min(i, target)}-${Math.max(i, target)}`;
      if (!seen.has(key) && target !== i) {
        seen.add(key);
        edges.push([i, target]);
      }
    }
    // connect similar length node names (semantic similarity approximation)
    for (let k = i + 1; k < nodes.length; k++) {
      const lenDiff = Math.abs(nodes[i].length - nodes[k].length);
      const key = `${i}-${k}`;
      if (lenDiff <= 2 && !seen.has(key)) {
        seen.add(key);
        edges.push([i, k]);
      }
    }
  }
  return edges;
}

export default function GraphPage() {
  const navigate = useNavigate();
  const [nodes, setNodes]     = useState([]);
  const [edges, setEdges]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await getGraphStats();
        const nodeList = data.nodes || [];
        setNodes(nodeList);
        setEdges(buildEdges(nodeList));
        setUsingMock(false);
      } catch {
        setNodes(MOCK_NODES);
        setEdges(MOCK_EDGES);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  return (
    <div className="relative w-full h-screen bg-bg-base text-text-primary overflow-hidden">

      {/* 3D canvas — full screen */}
      <div className="absolute inset-0 z-0">
        {!loading && <ForceGraph3D nodes={nodes} edges={edges} />}
      </div>

      {/* loading state */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-bg-base"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-accent-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="text-[13px] text-text-secondary">
                Building knowledge graph…
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-8 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.8), transparent)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-semibold bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #FF0000 0%, #FF6B6B 45%, #ffffff 100%)" }}
          >
            ACRE
          </span>
          <span className="text-[11px] text-text-secondary border border-white/10 rounded-full px-2 py-0.5">
            Knowledge Graph
          </span>
          {usingMock && (
            <span className="text-[11px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">
              Sample graph
            </span>
          )}
        </div>

        <button
          onClick={() => navigate("/query")}
          className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Back to Query
        </button>
      </div>

      {/* bottom stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: loading ? 0 : 1, y: loading ? 20 : 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 z-10 px-8 py-6 flex items-center justify-between"
        style={{ background: "linear-gradient(to top, rgba(10,10,10,0.8), transparent)" }}
      >
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] text-text-secondary">Nodes</span>
            <span className="text-lg font-semibold text-text-primary">{nodes.length}</span>
          </div>
          <div className="w-px h-8 bg-border-default" />
          <div className="flex flex-col">
            <span className="text-[11px] text-text-secondary">Edges</span>
            <span className="text-lg font-semibold text-text-primary">{edges.length}</span>
          </div>
        </div>

        <p className="text-[11px] text-text-secondary">
          Drag to rotate · Scroll to zoom · Hover nodes to inspect
        </p>
      </motion.div>

    </div>
  );
}