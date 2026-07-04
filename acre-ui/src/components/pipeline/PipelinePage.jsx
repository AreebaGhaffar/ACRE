import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const STAGES = [
  {
    id: "planner",
    label: "Query Planner",
    tagline: "Decomposes complexity",
    description:
      "Breaks a complex question into focused sub-queries, so every part of what you asked actually gets answered instead of the model guessing at the most obvious piece.",
  },
  {
    id: "chunker",
    label: "Graph Chunker",
    tagline: "Builds structure",
    description:
      "Reads ingested documents and builds a semantic knowledge graph of concept nodes and relationships, instead of splitting text into arbitrary flat chunks.",
  },
  {
    id: "critic",
    label: "Retrieval Critic",
    tagline: "Filters noise",
    description:
      "Scores every retrieved result on relevance, coherence, and freshness, discarding weak matches before they ever reach the model's context window.",
  },
  {
    id: "resolver",
    label: "Conflict Resolver",
    tagline: "Reconciles sources",
    description:
      "Detects contradicting information across your corpus and resolves it automatically, citing which source won and why, instead of silently picking one.",
  },
];

const STAGE_DURATION = 2200;

export default function PipelinePage() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const runDemo = () => {
    clearInterval(intervalRef.current);
    setRunning(true);
    setActiveIndex(0);

    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx++;
      if (idx < STAGES.length) {
        setActiveIndex(idx);
      } else {
        clearInterval(intervalRef.current);
        setRunning(false);
      }
    }, STAGE_DURATION);
  };

  useEffect(() => {
    runDemo();
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-bg-base text-text-primary px-6 md:px-12 py-10 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(255,0,0,0.08), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex items-center justify-between mb-16">
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-semibold bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #FF0000 0%, #FF6B6B 45%, #ffffff 100%)",
            }}
          >
            ACRE
          </span>
          <span className="text-[11px] text-text-secondary border border-border-default rounded-full px-2 py-0.5">
            Pipeline
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/query")}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Query Interface
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      <div className="relative z-10 text-center mb-16">
        <p className="text-text-secondary text-[13px] tracking-[0.25em] uppercase font-mono mb-3">
          How ACRE Thinks
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
          One question, four stages
        </h1>
      </div>

      <div className="relative z-10 flex justify-center mb-16">
        <button
          onClick={runDemo}
          disabled={running}
          className="bg-accent-primary text-white text-sm font-semibold px-6 py-3 rounded-full disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ boxShadow: "0 0 18px rgba(255,0,0,0.3)" }}
        >
          {running ? "Running…" : "Replay Pipeline"}
        </button>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-border-default">
          <motion.div
            className="h-full bg-accent-primary"
            style={{
              boxShadow: "0 0 8px rgba(255,0,0,0.6)",
              transformOrigin: "left",
            }}
            initial={{ scaleX: 0 }}
            animate={{
              scaleX:
                activeIndex < 0
                  ? 0
                  : Math.min(activeIndex, STAGES.length - 1) /
                    (STAGES.length - 1),
            }}
            transition={{ duration: STAGE_DURATION / 1000, ease: "linear" }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {STAGES.map((stage, i) => {
            const isActive = activeIndex === i;
            const isDone = activeIndex > i;
            const isLit = isActive || isDone;

            return (
              <div key={stage.id} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border border-accent-primary"
                      initial={{ scale: 1, opacity: 0.7 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 relative z-10 bg-bg-base"
                    animate={{
                      borderColor: isLit ? "#FF0000" : "#2a2a2a",
                      boxShadow: isLit
                        ? "0 0 24px rgba(255,0,0,0.4)"
                        : "0 0 0 rgba(0,0,0,0)",
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <span
                      className="font-mono text-sm font-semibold"
                      style={{ color: isLit ? "#FF6B6B" : "#555" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </motion.div>
                </div>

                <div>
                  <motion.h3
                    className="text-base font-semibold mb-1"
                    animate={{ color: isLit ? "#ffffff" : "#555555" }}
                    transition={{ duration: 0.3 }}
                  >
                    {stage.label}
                  </motion.h3>
                  <p className="text-[11px] text-accent-primary font-mono uppercase tracking-wider">
                    {stage.tagline}
                  </p>
                </div>

                <AnimatePresence>
                  {isLit && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                      className="border border-border-default rounded-card p-4 bg-white/[0.02] backdrop-blur-sm"
                    >
                      <p className="text-[13px] text-text-secondary leading-relaxed">
                        {stage.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}