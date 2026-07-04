from modules.graph_chunker import SemanticGraphChunker
from modules.retrieval_critic import RetrievalCritic
from modules.conflict_resolver import ConflictResolver

chunker = SemanticGraphChunker()

# Two contradicting documents
doc1 = """
AMD acquired Xilinx in 2022 for 49 billion dollars.
This acquisition made AMD the largest FPGA manufacturer in the world.
"""

doc2 = """
AMD acquired Xilinx in 2020 for 35 billion dollars.
Intel remains the largest FPGA manufacturer despite AMD's acquisition.
"""

print("Ingesting documents...")
chunker.chunk(doc1, source="doc1")
chunker.chunk(doc2, source="doc2")

print("Retrieving chunks...")
chunks = chunker.retrieve("AMD Xilinx acquisition", k=5)

print("\nRunning Critic...")
critic = RetrievalCritic()
passed = critic.filter_chunks("AMD Xilinx acquisition", chunks)

print(f"\nRunning Conflict Resolver on {len(passed)} chunks...")
resolver = ConflictResolver()
result = resolver.resolve_all(passed, "AMD Xilinx acquisition")

print(f"\nConflicts found: {result['conflict_count']}")
for r in result["resolutions"]:
    print(f"\n⚡ Conflict: {r['source_a']} vs {r['source_b']}")
    print(f"Resolution: {r['resolution'][:200]}...")