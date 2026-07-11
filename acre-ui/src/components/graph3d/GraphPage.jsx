import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FlowchartView from "./FlowchartView";

export default function GraphPage() {
  const navigate = useNavigate();
  const [lastQuery, setLastQuery] = useState(null);
  const [subgraph, setSubgraph] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("acre_last_flowchart");
    if (saved) {
      const data = JSON.parse(saved);
      setLastQuery(data.query);
      const edges = data.flowchart_edges || [];
      setSubgraph({
        nodes: [...new Set(edges.flatMap(e => [e.from, e.to]))]
          .map(id => ({ id, label: id, entity_type: "OTHER" })),
        edges: edges.map(e => ({ from: e.from, to: e.to, relation: e.relation })),
      });
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>

      {/* header */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,10,10,0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize: 20, fontWeight: 600,
            background: "linear-gradient(135deg, #FF0000, #FF6B6B, #fff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>ACRE</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2px 8px" }}>
            Concept Flowchart
          </span>
          {lastQuery && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              "{lastQuery}"
            </span>
          )}
        </div>

        <button
          onClick={() => navigate("/query")}
          style={{
            fontSize: 13, color: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "6px 12px",
            background: "transparent", cursor: "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(255,0,0,0.4)"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >
          ← Back to Query
        </button>
      </div>

      {/* flowchart area */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {!lastQuery && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 60 }}>
            Run a query on the Query page first — its flowchart will appear here automatically.
          </p>
        )}
        {lastQuery && <FlowchartView subgraph={subgraph} />}
      </div>
    </div>
  );
}