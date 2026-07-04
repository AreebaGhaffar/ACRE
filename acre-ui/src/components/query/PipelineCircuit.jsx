import { motion } from "framer-motion";

const STAGES = [
  { id: "planner",  label: "Query Planner",    x: 100 },
  { id: "chunker",  label: "Graph Chunker",     x: 300 },
  { id: "critic",   label: "Retrieval Critic",  x: 500 },
  { id: "resolver", label: "Conflict Resolver", x: 700 },
];

const Y = 55;
const NODE_R = 26;

export default function PipelineCircuit({ active, activeIndex }) {
  return (
    <div className="w-full flex justify-center py-6">
      <svg viewBox="0 0 800 130" className="w-full max-w-3xl" style={{ height: 130 }}>

        <defs>
          <filter id="redglow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── static dashed traces ── */}
        {STAGES.slice(0, -1).map((stage, i) => (
          <line
            key={`trace-${i}`}
            x1={stage.x + NODE_R}
            y1={Y}
            x2={STAGES[i + 1].x - NODE_R}
            y2={Y}
            stroke="#2a2a2a"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        ))}

        {/* ── lit traces between completed stages ── */}
        {STAGES.slice(0, -1).map((stage, i) => (
          <motion.line
            key={`lit-${i}`}
            x1={stage.x + NODE_R}
            y1={Y}
            x2={STAGES[i + 1].x - NODE_R}
            y2={Y}
            stroke="#FF0000"
            strokeWidth="1.5"
            filter="url(#redglow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              active && activeIndex > i
                ? { opacity: 1 }
                : { opacity: 0 }
            }
            transition={{ duration: 0.5 }}
          />
        ))}

        {/* ── traveling dot ── */}
        {active && activeIndex >= 0 && activeIndex < STAGES.length - 1 && (
          <motion.circle
            r="5"
            fill="#FF0000"
            filter="url(#redglow)"
            initial={{
              cx: STAGES[activeIndex].x + NODE_R,
              cy: Y,
            }}
            animate={{
              cx: STAGES[activeIndex + 1].x - NODE_R,
              cy: Y,
            }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          />
        )}

        {/* ── nodes ── */}
        {STAGES.map((stage, i) => {
          const lit = active && activeIndex >= i;
          return (
            <g key={stage.id}>

              {/* pulse ring */}
              {lit && (
                <motion.circle
                  cx={stage.x}
                  cy={Y}
                  r={NODE_R}
                  fill="none"
                  stroke="#FF0000"
                  strokeWidth="1"
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
              )}

              {/* node bg */}
              <motion.circle
                cx={stage.x}
                cy={Y}
                r={NODE_R}
                fill="#0a0a0a"
                stroke={lit ? "#FF0000" : "#2a2a2a"}
                strokeWidth={lit ? 1.5 : 1}
                filter={lit ? "url(#redglow)" : "none"}
                animate={{ stroke: lit ? "#FF0000" : "#2a2a2a" }}
                transition={{ duration: 0.4 }}
              />

              {/* step number */}
              <text
                x={stage.x}
                y={Y - 6}
                textAnchor="middle"
                fontSize="9"
                fontFamily="monospace"
                fill={lit ? "#FF6B6B" : "#444"}
              >
                {String(i + 1).padStart(2, "0")}
              </text>

              {/* active dot inside node */}
              {lit && (
                <motion.circle
                  cx={stage.x}
                  cy={Y + 8}
                  r="3"
                  fill="#FF0000"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              )}

              {/* label */}
              <motion.text
                x={stage.x}
                y={Y + NODE_R + 18}
                textAnchor="middle"
                fontSize="11"
                fontFamily="Inter, sans-serif"
                animate={{ fill: lit ? "#ffffff" : "#555555" }}
                transition={{ duration: 0.3 }}
              >
                {stage.label}
              </motion.text>

            </g>
          );
        })}

      </svg>
    </div>
  );
}