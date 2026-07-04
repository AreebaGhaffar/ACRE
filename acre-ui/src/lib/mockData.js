// Mock data shaped like what the real /graph/stats endpoint should return.
// Swap this for a real API call later — nothing else should need to change
// if the real response matches this shape: { nodes: [...], edges: [...] }

export const mockGraphData = {
  nodes: [
    { id: "n1", name: "Neural Networks" },
    { id: "n2", name: "Backpropagation" },
    { id: "n3", name: "Gradient Descent" },
    { id: "n4", name: "Transformers" },
    { id: "n5", name: "Attention Mechanism" },
    { id: "n6", name: "Self-Attention" },
    { id: "n7", name: "RAG" },
    { id: "n8", name: "Vector Embeddings" },
    { id: "n9", name: "Knowledge Graphs" },
    { id: "n10", name: "Semantic Search" },
    { id: "n11", name: "LLMs" },
    { id: "n12", name: "Fine-Tuning" },
    { id: "n13", name: "Tokenization" },
    { id: "n14", name: "Embeddings Space" },
    { id: "n15", name: "Cosine Similarity" },
    { id: "n16", name: "Chunking Strategy" },
    { id: "n17", name: "Retrieval Critic" },
    { id: "n18", name: "Conflict Resolution" },
    { id: "n19", name: "Query Decomposition" },
    { id: "n20", name: "Multi-Agent Systems" },
  ],
  edges: [
    ["n1", "n2"], ["n1", "n3"], ["n2", "n3"],
    ["n1", "n4"], ["n4", "n5"], ["n5", "n6"],
    ["n4", "n11"], ["n11", "n12"], ["n11", "n13"],
    ["n7", "n8"], ["n7", "n9"], ["n7", "n11"],
    ["n8", "n14"], ["n8", "n15"], ["n9", "n10"],
    ["n10", "n15"], ["n7", "n16"], ["n16", "n17"],
    ["n17", "n18"], ["n7", "n19"], ["n19", "n20"],
    ["n17", "n20"], ["n9", "n14"], ["n6", "n19"],
    ["n13", "n14"],
  ],
};