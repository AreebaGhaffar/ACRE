import json
import requests


class QueryPlanner:
    def __init__(self, graph_chunker, critic, resolver):
        self.chunker = graph_chunker
        self.critic = critic
        self.resolver = resolver
        self.model = "qwen2.5:7b"
        self.base_url = "http://localhost:11434/api/chat"

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

        # final synthesis
        synthesis_prompt = f"Original question: {query}\n\n"
        for sa in sub_answers:
            synthesis_prompt += f"Sub-question: {sa['sub_query']}\n"
            synthesis_prompt += f"Evidence: {[c['context'][:100] for c in sa['chunks']]}\n\n"
        synthesis_prompt += "Synthesize a final comprehensive answer with references to the evidence."

        print("\nSynthesizing final answer...")
        final_answer = self._ask_local(synthesis_prompt)

        return {
            "query": query,
            "sub_answers": sub_answers,
            "final_answer": final_answer
        }