import { useNavigate } from "react-router-dom";
import GraphCanvas from "../graph/GraphCanvas";
import PipelineCards from "./PipelineCards";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen w-full bg-bg-base text-text-primary flex flex-col items-center">
      <GraphCanvas />

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 min-h-screen">
        <p className="text-text-secondary text-[13px] tracking-[0.2em] uppercase mb-8">
          AMD Developer Hackathon — Act II
        </p>

        <h1
          className="text-5xl md:text-7xl font-semibold leading-none bg-clip-text text-transparent"
          style={{
            backgroundImage: "linear-gradient(135deg, #FF0000 0%, #FF6B6B 45%, #ffffff 100%)",
            letterSpacing: "-0.02em",
          }}
        >
          ACRE
        </h1>

        <p className="mt-6 text-text-secondary text-base max-w-md">
          Adaptive Cognitive RAG Engine — a multi-agent pipeline that retrieves, critiques, and resolves knowledge before generating an answer.
        </p>

        <div className="flex items-center gap-4 mt-12">
          <button
            onClick={() => navigate("/query")}
            style={{ 
              background: "#FF0000",
              boxShadow: "0 0 20px rgba(255,0,0,0.4)"
            }}
            className="text-white text-sm font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-red-500"
            onMouseEnter={e => {
              e.target.style.background = "#cc0000";
              e.target.style.boxShadow = "0 0 35px rgba(255,0,0,0.6)";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={e => {
              e.target.style.background = "#FF0000";
              e.target.style.boxShadow = "0 0 20px rgba(255,0,0,0.4)";
              e.target.style.transform = "scale(1)";
            }}
          >
            Try ACRE
          </button>
          <button
            style={{ 
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)"
            }}
            className="text-white text-sm font-semibold px-8 py-3 rounded-lg transition-all duration-300"
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.6)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.3)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={() => window.open("https://github.com/AreebaGhaffar/ACRE", "_blank")}
          >
            View on GitHub
          </button>
        </div>
      </section>

      <PipelineCards />

    </main>
  );
}