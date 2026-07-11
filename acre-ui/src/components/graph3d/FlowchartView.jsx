import { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";
import { motion } from "framer-motion";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    background: "#0a0a0a",
    primaryColor: "#1a0000",
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#FF0000",
    lineColor: "#FF6B6B",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
  },
  flowchart: { curve: "basis", nodeSpacing: 40, rankSpacing: 60 },
});

function sanitizeId(text) {
  // Mermaid node IDs can't contain spaces/special chars — map to safe ids
  return "n" + text.replace(/[^a-zA-Z0-9]/g, "_");
}

function buildMermaidSpec(subgraph) {
  if (!subgraph || !subgraph.nodes.length) return null;

  let lines = ["graph TD"];
  const idMap = {};
  subgraph.nodes.forEach((n) => {
    const id = sanitizeId(n.id);
    idMap[n.id] = id;
    const label = n.label.replace(/"/g, "'");
    lines.push(`  ${id}["${label}"]`);
  });

  subgraph.edges.forEach((e) => {
    const from = idMap[e.from];
    const to = idMap[e.to];
    if (!from || !to) return;
    const relation = (e.relation || "related to").replace(/"/g, "'");
    lines.push(`  ${from} -->|${relation}| ${to}`);
  });

  return lines.join("\n");
}

export default function FlowchartView({ subgraph }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState(null);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    const spec = buildMermaidSpec(subgraph);
    if (!spec) {
      setSvgContent(null);
      return;
    }

    const renderId = "flowchart-" + Date.now();
    mermaid
      .render(renderId, spec)
      .then(({ svg }) => {
        setSvgContent(svg);
        setRenderError(null);
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
        setRenderError("Could not render flowchart for this result.");
      });
  }, [subgraph]);

  if (renderError) {
    return <p style={{ fontSize: 13, color: "#f87171", textAlign: "center", padding: 40 }}>{renderError}</p>;
  }

  if (!svgContent) {
    return (
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 }}>
        No relevant concepts found — try ingesting a document first, or rephrasing your question.
      </p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: "100%", height: "100%", overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}