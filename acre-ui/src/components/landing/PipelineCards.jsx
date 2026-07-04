import { motion } from "framer-motion";

const cards = [
  {
    num: "01",
    title: "Graph Chunker",
    desc: "Breaks documents into concept nodes and builds a semantic knowledge graph instead of flat text chunks.",
    tags: ["Node-based indexing"],
  },
  {
    num: "02",
    title: "Retrieval Critic",
    desc: "Scores every retrieved result before passing it to the model — nothing irrelevant gets through.",
    tags: ["Relevance", "Coherence", "Freshness"],
  },
  {
    num: "03",
    title: "Conflict Resolver",
    desc: "Detects contradicting sources across your corpus and reconciles them automatically with inline citations.",
    tags: ["Sources reconciled"],
  },
  {
    num: "04",
    title: "Query Planner",
    desc: "Decomposes complex questions into focused sub-queries so every part of your question gets answered.",
    tags: ["Multi-step decomposition"],
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 32,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function PipelineCards() {
  return (
    <section className="relative z-10 w-full max-w-5xl px-6 pb-24">

      <p className="text-center text-text-secondary text-[13px] tracking-[0.2em] uppercase mb-12">
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
              borderColor: "rgba(255,0,0,0.5)",
              boxShadow: "0 0 20px rgba(255,0,0,0.12)",
              transition: { duration: 0.2 },
            }}
            className="border border-border-default rounded-card p-6 bg-bg-base/60 backdrop-blur-sm flex flex-col gap-4 cursor-default"
          >
            <span className="text-[13px] text-text-secondary font-medium">
              {card.num}
            </span>

            <h3 className="text-base font-semibold text-text-primary leading-snug">
              {card.title}
            </h3>

            <p className="text-[13px] text-text-secondary leading-relaxed flex-1">
              {card.desc}
            </p>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border-default">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] text-text-secondary border border-border-default rounded-full px-2 py-0.5"
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