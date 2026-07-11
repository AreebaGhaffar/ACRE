import json
import requests
import spacy
import networkx as nx
import torch
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv()

STOP_ENTITY_TYPES = {"CARDINAL", "ORDINAL", "PERCENT", "QUANTITY", "MONEY", "TIME"}


class SemanticGraphChunker:
        
    def __init__(self):
        print("Loading spaCy model...")
        self.nlp = spacy.load("en_core_web_trf")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")
        print("Loading sentence transformer...")
        self.embedder = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2",
            device=self.device
        )
        self.graph = nx.DiGraph()
        self.model = "accounts/fireworks/models/qwen3p7-plus"
        self.base_url = "https://api.fireworks.ai/inference/v1/chat/completions"
        self.api_key = os.getenv("FIREWORKS_API_KEY")

    def reset(self):
        """Clear all previously ingested data. Call this before a fresh ingest
        if you want a clean graph instead of accumulating across sessions."""
        self.graph = nx.DiGraph()
        
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


    def _extract_relations_llm(self, text_block: str) -> list:
        """Ask Qwen to extract clean concept relations from a block of text.
        Batching multiple sentences per call (instead of 1 call per sentence)
        keeps the number of LLM calls manageable."""
        prompt = f"""Extract key concepts and their relationships from this text.

Text:
{text_block}

Rules:
- Only extract meaningful named concepts (technologies, people, organizations, specific terms) — never numbers, dates, or generic words like "one" or "it".
- Relations must be short and specific (e.g. "created by", "runs on", "extends"), never generic words like "be" or "use".
- Return ONLY a JSON array, nothing else, in this exact format:
[{{"from": "Scala", "relation": "runs on", "to": "JVM"}}]
- If no clear relationships exist, return []"""

        response = self._ask_local(prompt)
        try:
            start = response.find("[")
            end = response.rfind("]") + 1
            return json.loads(response[start:end])
        except Exception:
            return []

    def chunk(self, text: str, source: str = "unknown") -> nx.DiGraph:
        doc = self.nlp(text)

        # Add entity nodes (still using spaCy, but filtered)
        for ent in doc.ents:
            if ent.label_ in STOP_ENTITY_TYPES:
                continue
            if len(ent.text.strip()) <= 1:
                continue
            embedding = self.embedder.encode(ent.text, convert_to_tensor=True)
            if not self.graph.has_node(ent.text):
                self.graph.add_node(
                    ent.text,
                    label=ent.label_,
                    entity_type=ent.label_,
                    embedding=embedding,
                    context=ent.sent.text,
                    source=source,
                    description=self._get_description(ent)
                )

        # Batch sentences into groups (e.g. 4 at a time) to limit LLM calls
        sentences = list(doc.sents)
        batch_size = 4
        for i in range(0, len(sentences), batch_size):
            batch = sentences[i:i + batch_size]
            text_block = " ".join(s.text.strip() for s in batch)
            relations = self._extract_relations_llm(text_block)

            for rel in relations:
                frm, to = rel.get("from", "").strip(), rel.get("to", "").strip()
                relation = rel.get("relation", "related to").strip()
                if not frm or not to:
                    continue
                # add nodes if they weren't caught by spaCy but are valid concepts
                if not self.graph.has_node(frm):
                    self.graph.add_node(frm, label="CONCEPT", entity_type="CONCEPT",
                                         context=text_block, source=source, description=text_block[:120])
                if not self.graph.has_node(to):
                    self.graph.add_node(to, label="CONCEPT", entity_type="CONCEPT",
                                         context=text_block, source=source, description=text_block[:120])
                if not self.graph.has_edge(frm, to):
                    self.graph.add_edge(frm, to, relation=relation, sentence=text_block, weight=1.0)

        return self.graph

    def _get_description(self, ent) -> str:
        sent = ent.sent.text.strip()
        if len(sent) > 120:
            sent = sent[:120] + "..."
        return sent

    def get_graph_data(self) -> dict:
        nodes = []
        for node, data in self.graph.nodes(data=True):
            nodes.append({
                "id": node,
                "label": node,
                "entity_type": data.get("entity_type", "MISC"),
                "description": data.get("description", ""),
                "source": data.get("source", "unknown"),
            })
        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "from": u, "to": v,
                "relation": data.get("relation", "related to"),
                "sentence": data.get("sentence", ""),
            })
        return {"nodes": nodes, "edges": edges}

    def retrieve(self, query: str, k: int = 5) -> list:
        if len(self.graph.nodes) == 0:
            return []
        q_emb = self.embedder.encode(query, convert_to_tensor=True)
        scores = {}
        for node, data in self.graph.nodes(data=True):
            if "embedding" in data:
                sim = torch.cosine_similarity(
                    q_emb.unsqueeze(0), data["embedding"].unsqueeze(0)
                ).item()
                scores[node] = sim
        top_nodes = sorted(scores, key=scores.get, reverse=True)[:k]
        results = []
        for n in top_nodes:
            neighbors = list(nx.ego_graph(self.graph, n, radius=2).nodes)
            context_parts = []
            for nb in neighbors:
                ctx = self.graph.nodes[nb].get("context", "")
                if ctx and ctx not in context_parts:
                    context_parts.append(ctx)
            results.append({
                "node": n, "score": scores[n],
                "context": " ".join(context_parts),
                "source": self.graph.nodes[n].get("source", "unknown")
            })
        return results

    def get_subgraph_for_nodes(self, node_names: list, radius: int = 1) -> dict:
        """NEW — returns only the small subgraph relevant to a specific query,
        instead of the entire knowledge graph. Use this for the query-scoped
        flowchart view."""
        relevant_nodes = set()
        for n in node_names:
            if self.graph.has_node(n):
                relevant_nodes.update(nx.ego_graph(self.graph, n, radius=radius).nodes)

        sub = self.graph.subgraph(relevant_nodes)
        nodes = [{"id": n, "label": n, "entity_type": sub.nodes[n].get("entity_type", "MISC")}
                 for n in sub.nodes]
        edges = [{"from": u, "to": v, "relation": d.get("relation", "related to")}
                 for u, v, d in sub.edges(data=True)]
        return {"nodes": nodes, "edges": edges}