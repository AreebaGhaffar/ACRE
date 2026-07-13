# 🧠 ACRE — Adaptive Cognitive RAG Engine

**Most RAG systems retrieve. ACRE reasons.**

Built for AMD Developer Hackathon: ACT II — Unicorn Track 🦄

![Landing](path/to/landing.png)

## The Problem

Normal RAG retrieves a few chunks, glues them together, and hopes. It never checks evidence quality, never notices conflicting sources, never breaks down hard questions — and never shows you *why*.

## What is ACRE?

ACRE decomposes questions, retrieves evidence, critically scores it, resolves contradictions, and explains its reasoning — then renders that reasoning as a **live concept flowchart**, on any topic, any document.

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

## 4 Novel Modules

| Module | Does | Why it matters |
|---|---|---|
| 🧩 Query Planner | Decomposes questions into sub-questions | Every part gets answered |
| 🕸️ Graph Chunker | LLM-based concept graph, not flat chunks | Captures relationships, not blobs |
| 🔬 Retrieval Critic | Scores chunks: relevance, coherence, freshness, specificity | Filters noise before synthesis |
| ⚡ Conflict Resolver | Detects + resolves contradicting sources | No silent guessing |

## ACRE vs Normal RAG

| | Normal RAG | ACRE |
|---|---|---|
| Chunking | Flat text splits | Semantic knowledge graph |
| Retrieval | Top-k, unfiltered | Critic-scored |
| Conflicts | Ignored | Detected + resolved |
| Complex Qs | One flat query | Decomposed |
| Output | Text | Text + flowchart |

## Query Interface

Ask a question, watch the 4-module pipeline run live, get a reasoned answer.

![Query Page](path/to/query.png)

## Concept Flowchart

Every answer also renders as a clean, topic-agnostic flowchart generated from the model's own reasoning.

![Flowchart](path/to/flowchart.png)

## Tech Stack

| Component | Technology |
|---|---|
| LLM | Qwen3.7 Plus via Fireworks AI |
| Inference Compute | AMD Instinct GPUs (via Fireworks) + validated AMD ROCm access (AMD Developer Cloud) |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| NLP | spaCy `en_core_web_trf` |
| Graph Engine | NetworkX (in-memory) |
| PDF Parsing | PyMuPDF |
| Backend API | FastAPI |
| Frontend | React, Vite, Tailwind, Framer Motion, Mermaid.js |
| Container | Docker + docker-compose |

## Project Structure

```
ACRE/
├── acre-backend/
│   ├── main.py              # FastAPI app, routes
│   ├── modules/
│   │   ├── query_planner.py       # decomposition + synthesis
│   │   ├── graph_chunker.py       # knowledge graph + retrieval
│   │   ├── retrieval_critic.py    # chunk scoring
│   │   ├── conflict_resolver.py   # contradiction detection
│   │   └── pdf_parser.py          # PDF text extraction
│   ├── Dockerfile
│   └── requirements.txt
├── acre-ui/
│   ├── src/components/
│   │   ├── query/            # Query page + pipeline UI
│   │   └── graph3d/           # Flowchart page
│   └── Dockerfile
└── docker-compose.yml
```

## AMD ROCm Integration

Inference runs on **Fireworks AI**, serving models on AMD Instinct GPUs. Development and testing also validated direct AMD GPU access on **AMD Developer Cloud** (ROCm + PyTorch), confirmed via `rocm-smi` and `torch.cuda.is_available()`.

![AMD GPU Proof](path/to/amd-gpu.png)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Fireworks AI API key ([get one here](https://fireworks.ai))

### 1. Clone the repository
```bash
git clone https://github.com/AreebaGhaffar/ACRE.git
cd ACRE
```

### 2. Add your API key
```bash
echo "FIREWORKS_API_KEY=your_key_here" > acre-backend/.env
```

### 3. Start with Docker
```bash
docker-compose up --build
```

### 4. Access the app
- **UI:** http://localhost:5173
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

![Docker Running](path/to/docker-screenshot.png)

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/ingest` | Ingest raw text |
| POST | `/ingest/pdf` | Ingest a PDF |
| POST | `/query` | Run full pipeline |
| GET | `/graph/stats` | Full graph data |
| GET | `/graph/subgraph` | Query-scoped flowchart |

---

## 👤 Team

Built for **AMD Developer Hackathon: ACT II** (July 6-11, 2026)  
by **Areeba Ghaffar** and **Maryam Malik**

---

## 📄 License

MIT License
