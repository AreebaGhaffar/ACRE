from modules.graph_chunker import SemanticGraphChunker
from modules.retrieval_critic import RetrievalCritic
from modules.conflict_resolver import ConflictResolver
from modules.query_planner import QueryPlanner

# Setup
chunker = SemanticGraphChunker()
critic = RetrievalCritic()
resolver = ConflictResolver()
planner = QueryPlanner(chunker, critic, resolver)

# Ingest documents
text = """
AMD is a semiconductor company based in Santa Clara California.
AMD acquired Xilinx in 2022 for 49 billion dollars.
Xilinx specializes in FPGA chips used in data centers and AI applications.
The acquisition helped AMD compete with Intel and NVIDIA in the AI chip market.
AMD's ROCm platform provides GPU computing capabilities similar to NVIDIA's CUDA.
AMD Instinct MI300X is the most powerful AI accelerator AMD has released.
"""

print("Ingesting document...")
chunker.chunk(text, source="amd_overview")

# Run full pipeline
result = planner.execute(
    "How did AMD's acquisition of Xilinx help them compete in the AI market?"
)

print("\n" + "="*50)
print("FINAL ANSWER:")
print("="*50)
print(result["final_answer"])