from modules.graph_chunker import SemanticGraphChunker
from modules.retrieval_critic import RetrievalCritic

chunker = SemanticGraphChunker()

text = """
AMD is a semiconductor company based in Santa Clara. 
AMD acquired Xilinx in 2022 for 49 billion dollars.
Xilinx specializes in FPGA chips used in data centers.
The acquisition helped AMD compete with Intel and NVIDIA in the AI chip market.
"""

chunker.chunk(text, source="amd_doc")

chunks = chunker.retrieve("AMD acquisition", k=3)

print("Running Retrieval Critic...\n")
critic = RetrievalCritic()
passed = critic.filter_chunks("AMD acquisition", chunks)

print(f"\n{len(passed)} out of {len(chunks)} chunks passed the critic")
for c in passed:
    print(f"\n✅ {c['node']} | Score: {c['critic_score']}")
    print(f"   Context: {c['context'][:100]}")