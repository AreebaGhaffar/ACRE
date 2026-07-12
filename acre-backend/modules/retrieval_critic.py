import os
import json
import re
import requests
from dotenv import load_dotenv

load_dotenv()

class RetrievalCritic:
    def __init__(self):
        self.model = "accounts/fireworks/models/qwen3p7-plus"
        self.base_url = "https://api.fireworks.ai/inference/v1/chat/completions"
        self.api_key = os.getenv("FIREWORKS_API_KEY")
        self.threshold = 0.35

    def score_chunk(self, query: str, chunk: str) -> dict:
        prompt = f"""You are a retrieval quality critic.
Query: {query}
Retrieved chunk: {chunk}

Score this chunk on these 4 dimensions from 0.0 to 1.0:
- relevance: does it directly answer the query?
- coherence: is it internally consistent?
- freshness: does it seem current and uncontradicted?
- specificity: does it contain concrete facts?

Reply ONLY with a JSON object, nothing else:
{{"relevance": 0.8, "coherence": 0.9, "freshness": 0.7, "specificity": 0.8}}"""

        try:
            response = requests.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.2,
                    "reasoning_effort": "none",
                },
                timeout=30
            )
            data = response.json()
            if "choices" not in data:
                print("FIREWORKS ERROR (critic):", data)
                return {"final": 0.0, "passed": False}
            text = data["choices"][0]["message"]["content"]
            text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
            start = text.find("{")
            end = text.find("}") + 1
            scores = json.loads(text[start:end])
            final = (
                scores["relevance"] * 0.4 +
                scores["coherence"] * 0.2 +
                scores["freshness"] * 0.2 +
                scores["specificity"] * 0.2
            )
            return {
                "scores": scores,
                "final": round(final, 3),
                "passed": final >= self.threshold
            }
        except Exception as e:
            print(f"Critic error: {e}")
            return {"final": 0.0, "passed": False}

    def filter_chunks(self, query: str, chunks: list) -> list:
        passed = []
        for chunk in chunks:
            result = self.score_chunk(query, chunk["context"])
            print(f"  Chunk '{chunk['node']}' score: {result['final']} → {'✅ PASS' if result['passed'] else '❌ FAIL'}")
            if result["passed"]:
                chunk["critic_score"] = result["final"]
                passed.append(chunk)
        return passed