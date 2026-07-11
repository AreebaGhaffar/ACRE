from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from modules.graph_chunker import SemanticGraphChunker
from modules.retrieval_critic import RetrievalCritic
from modules.conflict_resolver import ConflictResolver
from modules.query_planner import QueryPlanner
from modules.pdf_parser import PDFParser

app = FastAPI(title="ACRE - Adaptive Cognitive RAG Engine")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize all modules once at startup
chunker = SemanticGraphChunker()
critic = RetrievalCritic()
resolver = ConflictResolver()
planner = QueryPlanner(chunker, critic, resolver)
parser = PDFParser()

class QueryRequest(BaseModel):
    query: str

class IngestRequest(BaseModel):
    text: str
    source: str = "unknown"

@app.get("/")
def root():
    return {"status": "ACRE is running", "modules": ["graph_chunker", "retrieval_critic", "conflict_resolver", "query_planner"]}

@app.post("/ingest")
def ingest(request: IngestRequest):
    chunker.reset()  # clear old session data before a fresh ingest
    graph = chunker.chunk(request.text, source=request.source)
    return {
        "status": "ingested",
        "source": request.source,
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges()
    }

@app.post("/ingest/pdf")
async def ingest_pdf(file: UploadFile = File(...), source: str = Form(None)):
    chunker.reset()  # clear old session data before a fresh ingest
    pdf_bytes = await file.read()
    text = parser.extract_from_bytes(pdf_bytes)
    source_name = source or file.filename
    graph = chunker.chunk(text, source=source_name)
    return {
        "status": "ingested",
        "source": source_name,
        "filename": file.filename,
        "pages": len(text.split('\f')),
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "text_preview": text[:200]
    }

@app.post("/query")
def query(request: QueryRequest):
    result = planner.execute(request.query)

    return {
        "query": result["query"],
        "final_answer": result["final_answer"],
        "sub_queries": [sa["sub_query"] for sa in result["sub_answers"]],
        "total_conflicts": sum(sa["conflicts"] for sa in result["sub_answers"]),
        "flowchart_edges": result.get("flowchart_edges", [])
    }

@app.get("/graph/stats")
def graph_stats():
    graph_data = chunker.get_graph_data()
    return {
        "total_nodes": chunker.graph.number_of_nodes(),
        "total_edges": chunker.graph.number_of_edges(),
        "nodes": [n["id"] for n in graph_data["nodes"]],
        "graph": graph_data
    }

@app.get("/graph/subgraph")
def graph_subgraph(query: str):
    retrieved = chunker.retrieve(query, k=5)
    if not retrieved:
        return {"query": query, "subgraph": {"nodes": [], "edges": []}}

    center_node = retrieved[0]["node"]
    subgraph = chunker.get_subgraph_for_nodes([center_node], radius=1)

    # cap to at most 8 nodes so it stays readable
    if len(subgraph["nodes"]) > 8:
        keep_ids = {n["id"] for n in subgraph["nodes"][:8]}
        subgraph["nodes"] = [n for n in subgraph["nodes"] if n["id"] in keep_ids]
        subgraph["edges"] = [e for e in subgraph["edges"] if e["from"] in keep_ids and e["to"] in keep_ids]

    return {"query": query, "subgraph": subgraph}