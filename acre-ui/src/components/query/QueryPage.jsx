import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ingestDocument, runQuery } from "../../api/acre";
import TypewriterText from "./TypewriterText";
import useBackendStatus from "./useBackendStatus";
import GraphCanvas from "../graph/GraphCanvas";
import { useNavigate } from "react-router-dom";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PIPELINE_STAGES = [
  { id: "planner",  label: "Query Planner" },
  { id: "chunker",  label: "Graph Chunker" },
  { id: "critic",   label: "Retrieval Critic" },
  { id: "resolver", label: "Conflict Resolver" },
];

const MOCK_RESULT = {
  final_answer:
    "AMD acquired Xilinx in February 2022 for approximately $49 billion, making it one of the largest semiconductor acquisitions in history. The deal expanded AMD's portfolio into FPGAs and adaptive computing, directly competing with Intel's acquisition of Altera. This strengthened AMD's position in data center, communications, and embedded markets.",
  sub_queries: [
    "When did AMD acquire Xilinx?",
    "How much did the AMD-Xilinx acquisition cost?",
    "Why did AMD acquire Xilinx?",
    "How does this compare to Intel's acquisition of Altera?",
  ],
  total_conflicts: 2,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANIMATION VARIANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHARED STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const glass =
  "backdrop-blur-xl border border-white/[0.08] rounded-card";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INLINE PIPELINE — full stage animation inside query page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const INLINE_STAGES = [
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

function InlinePipeline({ activeIndex }) {
  return (
    <div className="relative max-w-4xl mx-auto">

      {/* progress line */}
      <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-border-default">
        <motion.div
          className="h-full bg-accent-primary"
          style={{ boxShadow: "0 0 8px rgba(255,0,0,0.6)", transformOrigin: "left" }}
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: activeIndex < 0
              ? 0
              : Math.min(activeIndex, INLINE_STAGES.length - 1) / (INLINE_STAGES.length - 1),
          }}
          transition={{ duration: 0.8, ease: "linear" }}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {INLINE_STAGES.map((stage, i) => {
          const isActive = activeIndex === i;
          const isDone   = activeIndex > i;
          const isLit    = isActive || isDone;

          return (
            <div key={stage.id} className="flex flex-col items-center text-center gap-3">

              {/* node */}
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
                  className="w-14 h-14 rounded-full flex items-center justify-center border-2 relative z-10"
                  style={{ background: "#0d0d0d" }}
                  animate={{
                    borderColor: isLit ? "#FF0000" : "#2a2a2a",
                    boxShadow: isLit ? "0 0 24px rgba(255,0,0,0.4)" : "none",
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

              {/* label + tagline */}
              <div>
                <motion.h3
                  className="text-sm font-semibold mb-1"
                  animate={{ color: isLit ? "#ffffff" : "#555555" }}
                  transition={{ duration: 0.3 }}
                >
                  {stage.label}
                </motion.h3>
                <p className="text-[10px] text-accent-primary font-mono uppercase tracking-wider">
                  {stage.tagline}
                </p>
              </div>

              {/* description card */}
              <AnimatePresence>
                {isLit && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="border border-border-default rounded-card p-3 bg-white/[0.02] w-full"
                  >
                    <p className="text-[11px] text-text-secondary leading-relaxed">
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
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATUS DOT — backend online/offline indicator
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StatusDot({ online }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        {online && (
          <motion.span
            className="absolute w-3 h-3 rounded-full bg-green-500/40"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
        <span
          className={`w-2 h-2 rounded-full ${
            online === null ? "bg-gray-600" : online ? "bg-green-500" : "bg-gray-600"
          }`}
        />
      </div>
      <span className="text-[11px] text-text-secondary">
        {online === null ? "Checking…" : online ? "Backend online" : "Backend offline"}
      </span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SIDEBAR — document ingestion panel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Sidebar() {
  const online = useBackendStatus();
  const [source, setSource]   = useState("");
  const [docText, setDocText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [focused, setFocused] = useState(null);

  const handleIngest = async () => {
    if (!source.trim() || !docText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await ingestDocument(source.trim(), docText.trim());
      setResult(data);
    } catch {
      setError("Ingestion failed — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className={`w-72 shrink-0 flex flex-col gap-6 px-6 py-8 border-r border-white/[0.06] ${glass}`}
      style={{ borderRadius: 0, background: "#0d0d0d" }}
    >
      {/* backend status */}
      <StatusDot online={online} />

      <div className="w-full h-px bg-border-default" />

      <p className="text-[11px] tracking-[0.2em] uppercase text-text-secondary">
        Document Ingestion
      </p>

      {/* inputs */}
      <div className="flex flex-col gap-3">

        <motion.div
          animate={{
            boxShadow:
              focused === "source"
                ? "0 0 0 1px #FF0000, 0 0 12px rgba(255,0,0,0.2)"
                : "0 0 0 1px #2a2a2a",
          }}
          className="rounded-button overflow-hidden"
        >
          <input
            type="text"
            placeholder="Source name"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onFocus={() => setFocused("source")}
            onBlur={() => setFocused(null)}
            className="w-full bg-white/[0.03] px-3 py-2 text-[13px] text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
        </motion.div>

        <motion.div
          animate={{
            boxShadow:
              focused === "doc"
                ? "0 0 0 1px #FF0000, 0 0 12px rgba(255,0,0,0.2)"
                : "0 0 0 1px #2a2a2a",
          }}
          className="rounded-card overflow-hidden"
        >
          <textarea
            placeholder="Paste document text here..."
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            onFocus={() => setFocused("doc")}
            onBlur={() => setFocused(null)}
            rows={10}
            className="w-full bg-white/[0.03] px-3 py-2 text-[13px] text-text-primary placeholder:text-text-secondary focus:outline-none resize-none"
          />
        </motion.div>

        <button
          onClick={handleIngest}
          disabled={loading || !source.trim() || !docText.trim()}
          className="w-full bg-accent-primary text-white text-[13px] font-semibold py-2.5 rounded-button disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          style={{ boxShadow: "0 0 18px rgba(255,0,0,0.3)" }}
        >
          {loading ? (
            <>
              <motion.span
                className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent inline-block"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Ingesting…
            </>
          ) : (
            "Ingest Document"
          )}
        </button>
      </div>

      {/* ingestion result / error */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`${glass} p-4 flex flex-col gap-2`}
            style={{ background: "#111" }}
          >
            <p className="text-[11px] text-accent-primary font-semibold uppercase tracking-wider">
              ✓ Ingested
            </p>
            <p className="text-[13px] text-text-primary font-medium">{result.source}</p>
            <div className="flex gap-4 mt-1">
              <div className="flex flex-col">
                <span className="text-[11px] text-text-secondary">Nodes</span>
                <span className="text-base font-semibold text-text-primary">{result.nodes}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-text-secondary">Edges</span>
                <span className="text-base font-semibold text-text-primary">{result.edges}</span>
              </div>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[12px] text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </aside>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY AREA — input + pipeline loader + results
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function QueryArea() {
  const [question, setQuestion]     = useState("");
  const [focused, setFocused]       = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);

  const handleQuery = async () => {
    if (!question.trim()) return;
    setProcessing(true);
    setResult(null);
    setError(null);
    setStageIndex(0);

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < PIPELINE_STAGES.length) {
        setStageIndex(idx);
      } else {
        clearInterval(interval);
      }
    }, 2500);

    try {
      const data = await runQuery(question);
      clearInterval(interval);
      setStageIndex(PIPELINE_STAGES.length);
      setResult({ query: question, ...data });
    } catch {
      clearInterval(interval);
      setError("Query failed — is the backend running?");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col gap-6 px-8 py-8 overflow-y-auto">

      {/* ── query input row ── */}
      <div className="flex gap-3">
        <motion.div
          className="flex-1 rounded-button overflow-hidden"
          animate={{
            boxShadow: focused
              ? "0 0 0 1px #FF0000, 0 0 20px rgba(255,0,0,0.25)"
              : "0 0 0 1px #2a2a2a",
          }}
          transition={{ duration: 0.2 }}
        >
          <input
            type="text"
            placeholder="Ask ACRE anything about your documents…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            className="w-full bg-[#0d0d0d] px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
        </motion.div>
        <button
          onClick={handleQuery}
          disabled={processing || !question.trim()}
          className="bg-accent-primary text-white text-sm font-semibold px-5 py-3 rounded-button disabled:opacity-40 transition-opacity whitespace-nowrap"
          style={{ boxShadow: "0 0 18px rgba(255,0,0,0.3)" }}
        >
          Run ACRE Pipeline
        </button>
      </div>

      {/* ── example questions row ── */}

      
{stageIndex < 0 && !result && (
        <div className="flex flex-wrap gap-2">
          {[
            "What did AMD acquire in 2022?",
            "How does ROCm compare to CUDA?",
            "What is AMD's data center strategy?",
          ].map((example) => (
            <button
              key={example}
              onClick={() => setQuestion(example)}
              className="text-[12px] text-text-secondary border border-border-default rounded-full px-3 py-1.5 hover:border-accent-primary hover:text-text-primary transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      )}
      {/* ── inline pipeline loader ── */}
      <AnimatePresence>
        {stageIndex >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`${glass} px-6 py-6`}
            style={{ background: "#0d0d0d", boxShadow: "inset 0 0 60px rgba(255,0,0,0.05)" }}
          >
            <p className="text-center text-[11px] text-text-secondary tracking-[0.2em] uppercase font-mono mb-8">
              Running ACRE Pipeline
            </p>

            <InlinePipeline activeIndex={stageIndex} />

            {processing && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
                <span className="text-[13px] text-text-secondary ml-2">
                  {PIPELINE_STAGES[Math.min(stageIndex, PIPELINE_STAGES.length - 1)]?.label} running…
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── results section ── */}
      <AnimatePresence>
        {result && (
          <motion.div initial="hidden" animate="visible" className="flex flex-col gap-6">

            {/* final answer */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className={`${glass} p-6 flex flex-col gap-4`}
              style={{ background: "#0d0d0d", boxShadow: "inset 0 0 40px rgba(255,0,0,0.04)" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] tracking-[0.2em] uppercase text-text-secondary font-mono">
                  ▸ Final Answer
                </p>
                {result.total_conflicts > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                    className="text-[11px] font-semibold bg-accent-primary/15 text-accent-primary border border-accent-primary/30 px-2.5 py-1 rounded-full"
                  >
                    {result.total_conflicts} conflict{result.total_conflicts > 1 ? "s" : ""} detected
                  </motion.span>
                )}
              </div>

              <div className="relative">
                <div
                  className="absolute inset-0 pointer-events-none rounded"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
                  }}
                />
                <TypewriterText text={result.final_answer} speed={14} />
              </div>
            </motion.div>

            {/* sub-questions */}
            {result.sub_queries?.length > 0 && (
              <motion.div variants={fadeUp} custom={1} className="flex flex-col gap-3">
                <p className="text-[11px] tracking-[0.2em] uppercase text-text-secondary">
                  Sub-questions generated
                </p>
                <div className="flex flex-col gap-2">
                  {result.sub_queries.map((q, i) => (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      custom={i + 2}
                      className={`${glass} flex items-start gap-3 px-4 py-3`}
                      style={{ background: "#0d0d0d" }}
                    >
                      <span className="text-[11px] text-accent-primary font-semibold mt-0.5 shrink-0 font-mono">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[13px] text-text-secondary leading-relaxed">{q}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── error ── */}
      {error && (
        <p className="text-[13px] text-red-400">{error}</p>
      )}

    </main>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE ROOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function QueryPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-bg-base text-text-primary flex flex-col overflow-hidden">

      {/* 3D background */}
      <div className="absolute inset-0 z-0 opacity-15">
        <GraphCanvas />
      </div>

      {/* dark overlay */}
      <div className="absolute inset-0 z-0 bg-bg-base/85 backdrop-blur-sm" />

      {/* main content */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── header ── */}
        <header className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between shrink-0 bg-[#0d0d0d]">
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
            <span className="text-[11px] text-text-secondary border border-white/10 rounded-full px-2 py-0.5">
              Query Interface
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/graph")}
              className="text-[13px] text-text-secondary border border-border-default rounded-button px-3 py-1.5 hover:border-white/40 transition-colors"
            >
             
              View Graph →
            </button>
            <a
              href="/"
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </header>

        {/* ── body ── */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <QueryArea />
        </div>

      </div>

    </div>
  );
}