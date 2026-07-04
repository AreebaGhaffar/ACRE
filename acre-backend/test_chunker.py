from modules.graph_chunker import SemanticGraphChunker

chunker = SemanticGraphChunker()

text = """
AMD is a semiconductor company based in Santa Clara. 
AMD acquired Xilinx in 2022 for 49 billion dollars.
Xilinx specializes in FPGA chips used in data centers.
The acquisition helped AMD compete with Intel and NVIDIA in the AI chip market.
"""

print("Chunking document...")
graph = chunker.chunk(text, source="amd_doc")

print(f"\nGraph has {graph.number_of_nodes()} nodes and {graph.number_of_edges()} edges")
print("\nNodes found:")
for node in graph.nodes():
    print(f"  - {node}")

print("\nTesting retrieval...")
results = chunker.retrieve("AMD acquisition", k=3)
for r in results:
    print(f"\nNode: {r['node']} | Score: {r['score']:.3f}")
    print(f"Context: {r['context'][:100]}...")