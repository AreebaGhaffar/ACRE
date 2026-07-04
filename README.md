# 🧠 ACRE — Adaptive Cognitive RAG Engine

> **AMD Developer Hackathon: ACT II** | Track 1 Submission  
> Built on AMD ROCm | Powered by Qwen 2.5 | Deployed with Docker

---

## 🚀 What is ACRE?

ACRE is a next-generation RAG (Retrieval-Augmented Generation) system that solves the **4 fundamental failures** of traditional RAG:

| Problem with Normal RAG | How ACRE Solves It |
|--------------------------|-------------------|
| Fixed-size chunking breaks context | **Semantic Graph Chunker** — builds a knowledge graph of concepts |
| No chunk quality validation | **Retrieval Critic** — scores every chunk before it reaches the LLM |
| Silent hallucination on contradictions | **Conflict Resolver** — detects and resolves contradictions with citations |
| Single-shot retrieval for complex questions | **Query Planner** — decomposes questions into sub-queries, retrieves iteratively |

---

## 🏗️ Architecture

```
Raw Documents (PDF/TXT/MD)
        ↓
🕸️  Module 1: Semantic Graph Chunker
        ↓  (concept nodes + relationship edges)
🧠  Module 4: Query Planner
        ↓  (decomposes query → N sub-queries)
🔍  Graph-Aware Retrieval (FAISS on AMD ROCm GPU)
        ↓  (for each sub-query)
🔬  Module 2: Retrieval Critic (Qwen 2.5 7B local)
        ↓  (scores & filters each chunk)
⚡  Module 3: Conflict Resolver
        ↓  (detects contradictions → resolves with citations)
✨  Final Answer with Citations
```

---

## 🔧 4 Novel Modules

### Module 1 — Semantic Graph Chunker
Instead of splitting text every 512 tokens, ACRE extracts **concepts and relationships** using NLP, building a knowledge graph where:
- Each **node** = a concept/entity
- Each **edge** = a relationship between concepts
- Retrieval follows **graph paths**, not just keyword similarity

### Module 2 — Retrieval Critic
A local Qwen 2.5 7B model that scores every retrieved chunk on **4 dimensions**:
- **Relevance** (40%) — does it answer the query?
- **Coherence** (20%) — is it internally consistent?
- **Freshness** (20%) — is it current and uncontradicted?
- **Specificity** (20%) — does it contain concrete facts?

Chunks scoring below **0.6** are filtered out before reaching the LLM.

### Module 3 — Conflict Resolver
When two chunks contradict each other, ACRE:
1. Detects the conflict using semantic similarity
2. Identifies which documents the chunks came from
3. Resolves the contradiction with explicit citations

No more silent hallucinated merges.

### Module 4 — Query Planner
Decomposes complex questions into atomic sub-queries:
```
"How did AMD's acquisition of Xilinx affect their AI strategy?"
    ↓
1. What did AMD acquire from Xilinx?
2. How does Xilinx technology relate to AMD's AI products?
3. What is AMD's current AI chip strategy?
```
Each sub-query retrieves, gets criticized, and gets resolved independently.

---

## 💻 Tech Stack

| Component | Technology |
|-----------|-----------|
| GPU Compute | AMD ROCm |
| LLM (local) | Qwen 2.5 7B via Ollama |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| NLP | spaCy en_core_web_trf |
| Graph Engine | NetworkX |
| Vector Store | Qdrant |
| API | FastAPI |
| Demo UI | Streamlit |
| Container | Docker + docker-compose |

---

## ⚡ Quick Start

### Prerequisites
- Docker & Docker Compose
- Ollama with Qwen 2.5 7B

### 1. Clone the repository
```bash
git clone https://github.com/AreebaGhaffar/ACRE.git
cd ACRE
```

### 2. Pull the local model
```bash
ollama pull qwen2.5:7b
```

### 3. Start with Docker
```bash
docker-compose up --build
```

### 4. Access the apps
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Demo UI**: http://localhost:8501

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/ingest` | Ingest a document into the knowledge graph |
| POST | `/query` | Run the full ACRE pipeline on a question |
| GET | `/graph/stats` | Get knowledge graph statistics |

### Example: Ingest a document
```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"text": "AMD acquired Xilinx in 2022 for 49 billion dollars.", "source": "amd_doc"}'
```

### Example: Query ACRE
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How did AMD compete with NVIDIA in AI?"}'
```

---

## 🎯 AMD ROCm Integration

ACRE is designed to run on AMD GPUs via ROCm:
- **Embeddings** run on AMD GPU via PyTorch ROCm
- **Local LLM inference** accelerated by AMD GPU
- **Parallel graph traversal** optimized for AMD architecture
- **Docker image** based on `rocm/pytorch:latest`

On AMD cloud GPU, inference is **10-20x faster** than CPU.

---

## 📊 ACRE vs Normal RAG

| Feature | Normal RAG | ACRE |
|---------|-----------|------|
| Chunking | Fixed 512 tokens | Semantic graph nodes |
| Retrieval | Passive similarity | Query-planned, multi-hop |
| Chunk quality | No validation | Critic scores each chunk |
| Contradictions | Silently merged | Detected & resolved |
| Complex questions | Single retrieval | Iterative retrieve-reason |
| AMD GPU use | CPU-heavy | Parallel graph on ROCm |

---

## 👤 Team

Built for **AMD Developer Hackathon: ACT II** (July 6-11, 2026)  
by **Areeba Ghaffar**

---

## 📄 License

MIT License