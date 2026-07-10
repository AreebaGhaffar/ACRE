import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getGraphStats } from "../../api/acre";
import * as d3 from "d3";

const ENTITY_COLORS = {
  "PERSON": "#FF6B6B",
  "ORG": "#FF4444",
  "GPE": "#FF8C00",
  "DATE": "#FFB347",
  "MONEY": "#FFD700",
  "PRODUCT": "#FF6B6B",
  "EVENT": "#FF4500",
  "MISC": "#FF0000",
  "default": "#FF2200",
};

function getColor(entityType) {
  return ENTITY_COLORS[entityType] || ENTITY_COLORS.default;
}

function KnowledgeGraph({ graphData }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // limit nodes and edges
    const maxNodes = 60;
    const maxEdges = 120;
    const limitedNodes = graphData.nodes.slice(0, maxNodes);
    const nodeIds = new Set(limitedNodes.map(n => n.id));
    const limitedEdges = graphData.edges
      .filter(e => nodeIds.has(e.from) && nodeIds.has(e.to))
      .slice(0, maxEdges);

    const nodeMap = {};
    limitedNodes.forEach((n, i) => { nodeMap[n.id] = i; });

    const nodes = limitedNodes.map(n => ({ ...n }));
    const links = limitedEdges.map(e => ({
      source: e.from,
      target: e.to,
      relation: e.relation,
      sentence: e.sentence,
    }));

    // zoom
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg.append("g");

    // arrow marker
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "rgba(255,50,0,0.6)");

    // force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // edges
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(255,50,0,0.25)")
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#arrow)");

    // edge labels
    const edgeLabel = g.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("font-size", 9)
      .attr("fill", "rgba(255,120,80,0.7)")
      .attr("text-anchor", "middle")
      .attr("font-family", "Inter, sans-serif")
      .text(d => d.relation);

    // node groups
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x; d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    // node circles
    node.append("circle")
      .attr("r", d => d.entity_type === "ORG" || d.entity_type === "PERSON" ? 12 : 8)
      .attr("fill", d => getColor(d.entity_type))
      .attr("fill-opacity", 0.9)
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .attr("r", 16)
          .attr("fill-opacity", 1);
        setTooltip({
          x: event.pageX,
          y: event.pageY,
          node: d,
        });
      })
      .on("mousemove", (event) => {
        setTooltip(prev => prev ? { ...prev, x: event.pageX, y: event.pageY } : null);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .attr("r", d.entity_type === "ORG" || d.entity_type === "PERSON" ? 12 : 8)
          .attr("fill-opacity", 0.9);
        setTooltip(null);
      });

    // node labels
    node.append("text")
      .attr("dy", 22)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "Inter, sans-serif")
      .attr("fill", "rgba(255,255,255,0.7)")
      .text(d => d.label.length > 15 ? d.label.slice(0, 15) + "…" : d.label);

    // simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      edgeLabel
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg
        ref={svgRef}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      />

      {/* tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 12,
          top: tooltip.y - 10,
          background: "rgba(10,10,10,0.97)",
          border: "1px solid rgba(255,0,0,0.4)",
          borderRadius: 10,
          padding: "10px 14px",
          color: "white",
          fontFamily: "Inter, sans-serif",
          pointerEvents: "none",
          zIndex: 1000,
          maxWidth: 280,
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {tooltip.node.label}
          </div>
          <div style={{ fontSize: 11, color: "#FF6B6B", marginBottom: 4 }}>
            {tooltip.node.entity_type}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
            {tooltip.node.description || "No description available"}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GraphPage() {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await getGraphStats();
        if (data.graph && data.graph.nodes.length > 0) {
          setGraphData(data.graph);
        } else {
          setError("No graph data — ingest a document first");
        }
      } catch {
        setError("Could not load graph — is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
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
            Knowledge Graph
          </span>
          {graphData && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              {graphData.nodes.length} nodes · {graphData.edges.length} relationships
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* legend */}
          <div style={{ display: "flex", gap: 12 }}>
            {[["PERSON", "#FF6B6B"], ["ORG", "#FF4444"], ["DATE", "#FFB347"], ["OTHER", "#FF2200"]].map(([type, color]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{type}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/query")}
            style={{
              fontSize: 13, color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "6px 12px",
              background: "transparent", cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(255,0,0,0.4)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
          >
            ← Back to Query
          </button>
        </div>
      </div>

      {/* instructions */}
      <div style={{ padding: "8px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          Scroll to zoom · Drag to pan · Drag nodes to rearrange · Hover nodes for details
        </p>
      </div>

      {/* graph area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF0000", display: "inline-block", margin: "0 4px" }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>Building knowledge graph…</p>
          </div>
        )}

        {error && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{error}</p>
            <button
              onClick={() => navigate("/query")}
              style={{ padding: "10px 20px", background: "#FF0000", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13 }}
            >
              Go ingest a document
            </button>
          </div>
        )}

        {graphData && !loading && (
          <KnowledgeGraph graphData={graphData} />
        )}
      </div>
    </div>
  );
}