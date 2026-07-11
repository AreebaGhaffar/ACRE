import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { ingestDocument, runQuery } from "../../api/acre";
import TypewriterText from "./TypewriterText";
import useBackendStatus from "./useBackendStatus";
import GraphCanvas from "../graph/GraphCanvas";
import { useNavigate } from "react-router-dom";

const PIPELINE_STAGES = [
  { id: "planner", label: "Query Planner" },
  { id: "chunker", label: "Graph Chunker" },
  { id: "critic", label: "Retrieval Critic" },
  { id: "resolver", label: "Conflict Resolver" },
];

const INLINE_STAGES = [
  {
    id: "planner",
    label: "Query Planner",
    tagline: "Decomposes complexity",
    icon: "🧠",
    description:
      "Breaks a complex question into focused sub-queries, so every part of what you asked actually gets answered.",
  },
  {
    id: "chunker",
    label: "Graph Chunker",
    tagline: "Builds structure",
    icon: "🕸️",
    description:
      "Reads ingested documents and builds a semantic knowledge graph instead of splitting text into arbitrary flat chunks.",
  },
  {
    id: "critic",
    label: "Retrieval Critic",
    tagline: "Filters noise",
    icon: "🔬",
    description:
      "Scores every retrieved result on relevance, coherence, and freshness, discarding weak matches before they reach the model.",
  },
  {
    id: "resolver",
    label: "Conflict Resolver",
    tagline: "Reconciles sources",
    icon: "⚡",
    description:
      "Detects contradicting information and resolves it automatically, citing which source won and why.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── HOVER BUTTON STYLE ──
const btnStyle = {
  transition: "all 0.2s ease",
};

// ── IDLE STATE (shown when no query running) ──
function IdleState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full gap-8 py-16"
    >
      {/* animated ACRE brain */}
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-red-500/20"
            style={{ width: 80 + i * 50, height: 80 + i * 50 }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6 }}
          />
        ))}
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
          style={{
            background: "linear-gradient(135deg, #1a0000, #2d0000)",
            border: "1px solid rgba(255,0,0,0.3)",
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🧠
        </motion.div>
      </div>

      <div className="text-center">
        <p className="text-white/60 text-sm font-medium mb-2">ACRE is ready</p>
        <p className="text-white/30 text-[12px] max-w-xs">
          Ingest a document on the left, then ask anything about it
        </p>
      </div>

      {/* 4 module pills */}
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {INLINE_STAGES.map((s, i) => (
          <motion.span
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="text-[11px] px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(255,0,0,0.06)",
              border: "1px solid rgba(255,0,0,0.15)",
              color: "rgba(255,100,100,0.8)",
            }}
          >
            {s.icon} {s.label}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

// ── PIPELINE ANIMATION ──
function InlinePipeline({ activeIndex }) {
  return (
    <div className="relative max-w-4xl mx-auto">
      <div
        className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <motion.div
          className="h-full"
          style={{
            background: "linear-gradient(90deg, #FF0000, #FF6B6B)",
            transformOrigin: "left",
          }}
          initial={{ scaleX: 0 }}
          animate={{
            scaleX:
              activeIndex < 0
                ? 0
                : Math.min(activeIndex, INLINE_STAGES.length - 1) /
                  (INLINE_STAGES.length - 1),
          }}
          transition={{ duration: 0.8, ease: "linear" }}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {INLINE_STAGES.map((stage, i) => {
          const isActive = activeIndex === i;
          const isDone = activeIndex > i;
          const isLit = isActive || isDone;

          return (
            <div
              key={stage.id}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: "1px solid #FF0000" }}
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
                <motion.div
                  className="w-14 h-14 rounded-full flex items-center justify-center border-2 relative z-10 text-xl"
                  style={{
                    background: isLit ? "rgba(255,0,0,0.1)" : "#0d0d0d",
                  }}
                  animate={{
                    borderColor: isLit ? "#FF0000" : "#2a2a2a",
                  }}
                  transition={{ duration: 0.4 }}
                >
                  {isDone ? (
                    "✓"
                  ) : isActive ? (
                    stage.icon
                  ) : (
                    <span
                      className="font-mono text-sm font-semibold"
                      style={{ color: "#555" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                </motion.div>
              </div>

              <div>
                <motion.h3
                  className="text-sm font-semibold mb-1"
                  animate={{ color: isLit ? "#ffffff" : "#555555" }}
                  transition={{ duration: 0.3 }}
                >
                  {stage.label}
                </motion.h3>
                <p
                  className="text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: isLit ? "#FF6B6B" : "#333" }}
                >
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
                    className="rounded-xl p-3 w-full"
                    style={{
                      background: "rgba(255,0,0,0.05)",
                      border: "1px solid rgba(255,0,0,0.15)",
                    }}
                  >
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
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

// ── STATUS DOT ──
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
          className={`w-2 h-2 rounded-full ${online === null ? "bg-gray-600" : online ? "bg-green-500" : "bg-gray-600"}`}
        />
      </div>
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        {online === null
          ? "Checking…"
          : online
            ? "Backend online"
            : "Backend offline"}
      </span>
    </div>
  );
}

// ── SIDEBAR ──
function Sidebar() {
  const online = useBackendStatus();
  const [source, setSource] = useState("");
  const [docText, setDocText] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [mode, setMode] = useState("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const handleIngest = async () => {
    if (mode === "text" && (!source.trim() || !docText.trim())) return;
    if (mode === "pdf" && !pdfFile) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      let data;
      if (mode === "pdf") {
        const formData = new FormData();
        formData.append("file", pdfFile);
        formData.append("source", source.trim() || pdfFile.name);
        const response = await fetch("http://127.0.0.1:8000/ingest/pdf", {
          method: "POST",
          body: formData,
        });
        data = await response.json();
      } else {
        data = await ingestDocument(source.trim(), docText.trim());
      }
      setResult(data);
    } catch {
      setError("Ingestion failed — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    background:
      focusedField === field
        ? "rgba(255,255,255,0.04)"
        : "rgba(255,255,255,0.02)",
    border:
      focusedField === field
        ? "1px solid rgba(255,0,0,0.5)"
        : "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    transition: "all 0.2s ease",
  });

  return (
    <aside
      className="w-72 shrink-0 flex flex-col gap-5 px-5 py-7"
      style={{
        background: "linear-gradient(180deg, #111 0%, #0a0a0a 100%)",
        borderRight: "1px solid rgba(255,0,0,0.12)",
      }}
    >
      <StatusDot online={online} />

      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

      <p
        className="text-[10px] tracking-[0.2em] uppercase"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Document Ingestion
      </p>

      {/* mode toggle */}
      <div
        className="flex rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {["text", "pdf"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "6px 0",
              fontSize: "12px",
              fontWeight: 500,
              background: mode === m ? "#FF0000" : "transparent",
              color: mode === m ? "white" : "rgba(255,255,255,0.4)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (mode !== m) e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              if (mode !== m)
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            {m === "text" ? "Text" : "PDF"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {/* source name input */}
        <input
          type="text"
          placeholder="Source name"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onFocus={() => setFocusedField("source")}
          onBlur={() => setFocusedField(null)}
          style={{
            ...inputStyle("source"),
            padding: "8px 12px",
            fontSize: "13px",
            color: "white",
            outline: "none",
            width: "100%",
          }}
        />

        {mode === "text" ? (
          <textarea
            placeholder="Paste document text here..."
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            onFocus={() => setFocusedField("doc")}
            onBlur={() => setFocusedField(null)}
            rows={9}
            style={{
              ...inputStyle("doc"),
              padding: "8px 12px",
              fontSize: "13px",
              color: "white",
              outline: "none",
              width: "100%",
              resize: "none",
            }}
          />
        ) : (
          <div
            onClick={() => document.getElementById("pdf-upload").click()}
            style={{
              ...inputStyle("pdf"),
              padding: "16px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              borderStyle: "dashed",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "1px dashed rgba(255,0,0,0.4)";
              e.currentTarget.style.background = "rgba(255,0,0,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border =
                "1px dashed rgba(255,255,255,0.08)";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
          >
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setPdfFile(e.target.files[0])}
            />
            <span style={{ fontSize: "24px" }}>{pdfFile ? "📄" : "⬆️"}</span>
            <p
              style={{
                fontSize: "12px",
                color: pdfFile ? "#FF6B6B" : "rgba(255,255,255,0.4)",
                textAlign: "center",
              }}
            >
              {pdfFile ? pdfFile.name : "Click to upload PDF"}
            </p>
            {pdfFile && (
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                {(pdfFile.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        )}

        {/* ingest button */}
        <button
          onClick={handleIngest}
          disabled={
            loading ||
            (mode === "text" && (!source.trim() || !docText.trim())) ||
            (mode === "pdf" && !pdfFile)
          }
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "13px",
            fontWeight: 600,
            color: "white",
            background: "linear-gradient(135deg, #FF0000, #cc0000)",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.background =
                "linear-gradient(135deg, #ff2222, #ee0000)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background =
              "linear-gradient(135deg, #FF0000, #cc0000)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
          }}
        >
          {loading ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <motion.span
                className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Ingesting…
            </span>
          ) : (
            "Ingest Document"
          )}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: "rgba(0,255,100,0.05)",
              border: "1px solid rgba(0,255,100,0.15)",
              borderRadius: "10px",
              padding: "12px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#4ade80",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              ✓ Ingested
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "white",
                fontWeight: 500,
                marginBottom: "8px",
              }}
            >
              {result.source}
            </p>
            <div style={{ display: "flex", gap: "16px" }}>
              {[
                ["Nodes", result.nodes],
                ["Edges", result.edges],
              ].map(([label, val]) => (
                <div key={label}>
                  <p
                    style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontSize: "12px", color: "#f87171" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </aside>
  );
}

// ── QUERY AREA ──
function QueryArea() {
  const [question, setQuestion] = useState("");
  const [focused, setFocused] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [openSubquery, setOpenSubquery] = useState(null);

  const handleQuery = async () => {
    if (!question.trim()) return;
    setProcessing(true);
    setResult(null);
    setError(null);
    setStageIndex(0);
    setOpenSubquery(null);

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < PIPELINE_STAGES.length) setStageIndex(idx);
      else clearInterval(interval);
    }, 2500);

    try {
      const data = await runQuery(question);
      clearInterval(interval);
      setStageIndex(PIPELINE_STAGES.length);
      setResult({ query: question, ...data });
      localStorage.setItem("acre_last_flowchart", JSON.stringify({
        query: question,
        flowchart_edges: data.flowchart_edges || [],
      }));
    } catch {
      clearInterval(interval);
      setError("Query failed — is the backend running?");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col gap-5 px-8 py-7 overflow-y-auto">
      {/* query input */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Ask ACRE anything about your documents…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === "Enter" && handleQuery()}
          style={{
            flex: 1,
            padding: "12px 16px",
            fontSize: "14px",
            color: "white",
            background: focused
              ? "rgba(255,255,255,0.04)"
              : "rgba(255,255,255,0.02)",
            border: focused
              ? "1px solid rgba(255,0,0,0.5)"
              : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            outline: "none",
            transition: "all 0.2s ease",
          }}
        />
        <button
          onClick={handleQuery}
          disabled={processing || !question.trim()}
          style={{
            padding: "12px 20px",
            fontSize: "13px",
            fontWeight: 600,
            color: "white",
            background: "linear-gradient(135deg, #FF0000, #cc0000)",
            border: "none",
            borderRadius: "12px",
            cursor: processing || !question.trim() ? "not-allowed" : "pointer",
            opacity: processing || !question.trim() ? 0.4 : 1,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.background =
                "linear-gradient(135deg, #ff2222, #ee0000)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background =
              "linear-gradient(135deg, #FF0000, #cc0000)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
          }}
        >
          Run ACRE Pipeline
        </button>
      </div>

      {/* example questions */}
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
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px",
                padding: "6px 12px",
                background: "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "1px solid rgba(255,0,0,0.4)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.background = "rgba(255,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border =
                  "1px solid rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {/* idle state */}
      {stageIndex < 0 && !result && <IdleState />}

      {/* pipeline */}
      <AnimatePresence>
        {stageIndex >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: "#0d0d0d",
              border: "1px solid rgba(255,0,0,0.1)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <p
              className="text-center text-[11px] tracking-[0.2em] uppercase font-mono mb-8"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Running ACRE Pipeline
            </p>
            <InlinePipeline activeIndex={stageIndex} />
            {processing && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#FF0000" }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
                <span
                  className="text-[13px] ml-2"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {
                    PIPELINE_STAGES[
                      Math.min(stageIndex, PIPELINE_STAGES.length - 1)
                    ]?.label
                  }{" "}
                  running…
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5"
          >
            {/* final answer */}
            <motion.div
              variants={fadeUp}
              custom={0}
              style={{
                background:
                  "linear-gradient(135deg, rgba(20,0,0,0.8), rgba(10,10,10,0.9))",
                border: "1px solid rgba(255,0,0,0.15)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-[11px] tracking-[0.2em] uppercase font-mono"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  ▸ Final Answer
                </p>
                {result.total_conflicts > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "rgba(255,0,0,0.1)",
                      color: "#FF6B6B",
                      border: "1px solid rgba(255,0,0,0.2)",
                      borderRadius: "20px",
                      padding: "3px 10px",
                    }}
                  >
                    {result.total_conflicts} conflict
                    {result.total_conflicts > 1 ? "s" : ""} detected
                  </motion.span>
                )}
              </div>

              <div className="markdown-answer">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#FF6B6B",
                          marginTop: "16px",
                          marginBottom: "8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => (
                      <p
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.85)",
                          marginBottom: "10px",
                        }}
                      >
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul
                        style={{
                          paddingLeft: "20px",
                          marginBottom: "10px",
                          listStyleType: "disc",
                        }}
                      >
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.6,
                          color: "rgba(255,255,255,0.75)",
                          marginBottom: "6px",
                        }}
                      >
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ color: "white", fontWeight: 600 }}>
                        {children}
                      </strong>
                    ),
                    code: ({ children }) => (
                      <code
                        style={{
                          background: "rgba(255,0,0,0.08)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "12.5px",
                          color: "#FF9B9B",
                        }}
                      >
                        {children}
                      </code>
                    ),
                  }}
                >
                  {result.final_answer.replace(/\\n/g, "\n")}
                </ReactMarkdown>
              </div>
            </motion.div>

            {/* sub-queries accordion */}
            {result.sub_queries?.length > 0 && (
              <motion.div
                variants={fadeUp}
                custom={1}
                className="flex flex-col gap-2"
              >
                <p
                  className="text-[11px] tracking-[0.2em] uppercase mb-1"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  Sub-questions generated
                </p>
                {result.sub_queries.map((q, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i + 2}>
                    <button
                      onClick={() =>
                        setOpenSubquery(openSubquery === i ? null : i)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background:
                          openSubquery === i
                            ? "rgba(255,0,0,0.08)"
                            : "rgba(255,255,255,0.02)",
                        border:
                          openSubquery === i
                            ? "1px solid rgba(255,0,0,0.2)"
                            : "1px solid rgba(255,255,255,0.06)",
                        borderRadius:
                          openSubquery === i ? "12px 12px 0 0" : "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (openSubquery !== i) {
                          e.currentTarget.style.border =
                            "1px solid rgba(255,0,0,0.2)";
                          e.currentTarget.style.background =
                            "rgba(255,0,0,0.04)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (openSubquery !== i) {
                          e.currentTarget.style.border =
                            "1px solid rgba(255,255,255,0.06)";
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.02)";
                        }
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#FF6B6B",
                            fontFamily: "monospace",
                            fontWeight: 600,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          {q}
                        </span>
                      </div>
                      <motion.span
                        animate={{ rotate: openSubquery === i ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          fontSize: "12px",
                        }}
                      >
                        ▼
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {openSubquery === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{
                            overflow: "hidden",
                            background: "rgba(255,0,0,0.04)",
                            border: "1px solid rgba(255,0,0,0.2)",
                            borderTop: "none",
                            borderRadius: "0 0 12px 12px",
                            padding: "10px 14px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "12px",
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            This sub-query was processed independently through
                            the ACRE pipeline — retrieved, critiqued, and
                            resolved before contributing to the final answer.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p style={{ fontSize: "13px", color: "#f87171" }}>{error}</p>}
    </main>
  );
}

// ── PAGE ROOT ──
export default function QueryPage() {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen w-full text-white flex flex-col overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      <div className="absolute inset-0 z-0 opacity-10">
        <GraphCanvas />
      </div>
      <div
        className="absolute inset-0 z-0"
        style={{ background: "rgba(10,10,10,0.9)" }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* header */}
        <header
          className="px-8 py-4 flex items-center justify-between shrink-0"
          style={{
            background: "rgba(10,10,10,0.95)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xl font-semibold"
              style={{
                background: "linear-gradient(135deg, #FF0000, #FF6B6B, #fff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ACRE
            </span>
            <span
              className="text-[11px]"
              style={{
                color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px",
                padding: "2px 8px",
              }}
            >
              Query Interface
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/graph")}
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "6px 12px",
                background: "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "1px solid rgba(255,0,0,0.4)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border =
                  "1px solid rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              View Graph →
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.4)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "white";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ← Back to Home
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <QueryArea />
        </div>
      </div>
    </div>
  );
}
