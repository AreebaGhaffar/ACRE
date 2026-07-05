import { motion } from "framer-motion";

const cards = [
  {
    num: "01",
    title: "Graph Chunker",
    desc: "Breaks documents into concept nodes and builds a semantic knowledge graph instead of flat text chunks.",
    tags: ["Node-based indexing"],
    icon: "🕸️",
  },
  {
    num: "02",
    title: "Retrieval Critic",
    desc: "Scores every retrieved result before passing it to the model — nothing irrelevant gets through.",
    tags: ["Relevance", "Coherence", "Freshness"],
    icon: "🔬",
  },
  {
    num: "03",
    title: "Conflict Resolver",
    desc: "Detects contradicting sources across your corpus and reconciles them automatically with inline citations.",
    tags: ["Sources reconciled"],
    icon: "⚡",
  },
  {
    num: "04",
    title: "Query Planner",
    desc: "Decomposes complex questions into focused sub-queries so every part of your question gets answered.",
    tags: ["Multi-step decomposition"],
    icon: "🧠",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PipelineCards() {
  return (
    <section className="relative z-10 w-full max-w-5xl px-6 pb-24">
      <p className="text-center text-[13px] tracking-[0.2em] uppercase mb-12"
        style={{ color: "rgba(255,255,255,0.4)" }}>
        How it works
      </p>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {cards.map((card) => (
          <motion.div
            key={card.num}
            variants={cardVariants}
            whileHover={{
              y: -8,
              transition: { duration: 0.25 },
            }}
            style={{
              background: "linear-gradient(145deg, rgba(30,30,30,0.9), rgba(15,15,15,0.95))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = "1px solid rgba(255,0,0,0.4)";
              e.currentTarget.style.boxShadow = "0 20px 60px rgba(255,0,0,0.15), 0 8px 32px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)";
            }}
            className="p-6 flex flex-col gap-4 cursor-default backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span style={{ color: "rgba(255,0,0,0.6)", fontFamily: "monospace", fontSize: "12px", fontWeight: 600 }}>
                {card.num}
              </span>
            </div>

            <h3 className="text-base font-semibold text-white leading-snug">
              {card.title}
            </h3>

            <p className="text-[13px] leading-relaxed flex-1"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              {card.desc}
            </p>

            <div className="flex flex-wrap gap-2 pt-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,80,80,0.8)",
                    background: "rgba(255,0,0,0.08)",
                    border: "1px solid rgba(255,0,0,0.15)",
                    borderRadius: "20px",
                    padding: "2px 10px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}