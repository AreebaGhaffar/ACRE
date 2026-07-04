import json
import requests
from sentence_transformers import SentenceTransformer, util


class ConflictResolver:
    def __init__(self):
        self.model = "qwen2.5:7b"
        self.base_url = "http://localhost:11434/api/chat"
        self.embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    def _ask_local(self, prompt: str) -> str:
        response = requests.post(
            self.base_url,
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False
            }
        )
        return response.json()["message"]["content"]

    def detect_conflicts(self, chunks: list) -> list:
        if len(chunks) < 2:
            return []

        texts = [c["context"] for c in chunks]
        embeddings = self.embedder.encode(texts, convert_to_tensor=True)
        sim_matrix = util.cos_sim(embeddings, embeddings)

        conflicts = []
        for i in range(len(chunks)):
            for j in range(i + 1, len(chunks)):
                if sim_matrix[i][j] > 0.3:
                    prompt = f"""Do these two statements contradict each other?
A: {texts[i]}
B: {texts[j]}
Answer only YES or NO."""
                    response = self._ask_local(prompt)
                    if "YES" in response.upper():
                        conflicts.append((chunks[i], chunks[j]))
                        print(f"  ⚠️ Conflict detected between '{chunks[i]['node']}' and '{chunks[j]['node']}'")
        return conflicts

    def resolve(self, conflict_pair: tuple, original_query: str) -> str:
        a, b = conflict_pair
        prompt = f"""Two sources conflict on this query: "{original_query}"

Source A (from: {a['source']}): {a['context']}
Source B (from: {b['source']}): {b['context']}

Analyze the conflict: which source is more reliable and why?
Give a resolved answer with explicit references to both sources."""

        return self._ask_local(prompt)

    def resolve_all(self, chunks: list, query: str) -> dict:
        conflicts = self.detect_conflicts(chunks)
        resolutions = []
        for pair in conflicts:
            resolution = self.resolve(pair, query)
            resolutions.append({
                "source_a": pair[0]["node"],
                "source_b": pair[1]["node"],
                "resolution": resolution
            })
        return {
            "conflict_count": len(conflicts),
            "resolutions": resolutions
        }