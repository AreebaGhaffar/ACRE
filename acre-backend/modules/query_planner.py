import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()


class QueryPlanner:
    def __init__(self, graph_chunker, critic, resolver):
        self.chunker = graph_chunker
        self.critic = critic
        self.resolver = resolver
        self.model = "accounts/fireworks/models/qwen3p7-plus"
        self.base_url = "https://api.fireworks.ai/inference/v1/chat/completions"
        self.api_key = os.getenv("FIREWORKS_API_KEY")

    def _ask_local(self, prompt: str) -> str:
        response = requests.post(
            self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1000,
                "temperature": 0.3,
                "reasoning_effort": "none",
            }
        )
        data = response.json()
        if "choices" not in data:
            print("FIREWORKS ERROR:", data)
            return "[]"
        content = data["choices"][0]["message"]["content"]
        import re
        content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
        return content

    def decompose(self, query: str) -> list:
        prompt = f"""Decompose this complex query into 3 atomic sub-questions.
Each sub-question must be answerable independently from a document.
Query: {query}
Return ONLY a JSON array of strings, nothing else:
["sub-question 1", "sub-question 2", "sub-question 3"]"""

        response = self._ask_local(prompt)
        try:
            start = response.find("[")
            end = response.find("]") + 1
            return json.loads(response[start:end])
        except:
            return [query]

    def execute(self, query: str) -> dict:
        print(f"\nDecomposing query: '{query}'")
        sub_queries = self.decompose(query)
        print(f"Sub-queries: {sub_queries}")

        sub_answers = []
        for sq in sub_queries:
            print(f"\nProcessing: '{sq}'")
            chunks = self.chunker.retrieve(sq, k=3)
            good_chunks = self.critic.filter_chunks(sq, chunks)
            conflict_result = self.resolver.resolve_all(good_chunks, sq)

            sub_answers.append({
                "sub_query": sq,
                "chunks": good_chunks,
                "conflicts": conflict_result["conflict_count"],
                "resolutions": conflict_result["resolutions"]
            })
            touched_nodes = []
            for sa in sub_answers:
                for c in sa["chunks"]:
                    touched_nodes.append(c["node"])

        # final synthesis
        evidence_block = ""
        for sa in sub_answers:
            evidence_block += f"- Sub-question: {sa['sub_query']}\n"
            for c in sa["chunks"]:
                evidence_block += f"  - Evidence: {c['context'][:200]}\n"

        synthesis_prompt = f"""You are answering this question using only the evidence below: {query}

Evidence from the document:
{evidence_block}

Write a clear, well-justified answer.

Rules:
1. Start with one sentence that directly answers the question.
2. If the question compares two or more things, structure your answer as 3-4 comparison points, each as:
## [Short aspect name]
- **[First thing]:** [what it does]
- **[Second thing]:** [how it differs]
- **Why it matters:** [practical benefit]
3. If the question is NOT a comparison, use 2-4 ## headings with short "- " bullets covering different aspects of the topic.
4. Never list disconnected facts — every point should build toward the question asked.
5. Keep every bullet under 20 words. No literal backslash-n characters.

After the Markdown answer, add a new line containing exactly ---FLOWCHART--- followed by a JSON array:
- If comparing two things: [{{"from": "Thing A", "relation": "aspect", "to": "Thing B", "why": "short reason, under 8 words"}}, ...]
- If not a comparison: [{{"from": "Main Topic", "relation": "covers", "to": "Aspect Name", "why": "short reason, under 8 words"}}, ...]
- Keep labels under 4 words. Valid JSON only.

Output only the Markdown answer, then ---FLOWCHART---, then the JSON. Nothing else."""

        print("\nSynthesizing final answer...")
        raw_response = self._ask_local(synthesis_prompt)
        raw_response = raw_response.replace("\\n", "\n").strip()

        if "---FLOWCHART---" in raw_response:
            final_answer, flowchart_part = raw_response.split("---FLOWCHART---", 1)
            final_answer = final_answer.strip()
            try:
                start = flowchart_part.find("[")
                end = flowchart_part.rfind("]") + 1
                flowchart_edges = json.loads(flowchart_part[start:end])
            except Exception:
                flowchart_edges = []
        else:
            final_answer = raw_response
            flowchart_edges = []
            
        return {
            "query": query,
            "sub_answers": sub_answers,
            "final_answer": final_answer,
            "flowchart_edges": flowchart_edges,
        }