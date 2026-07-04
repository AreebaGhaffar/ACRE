import spacy
import networkx as nx
import torch
from sentence_transformers import SentenceTransformer


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

    def chunk(self, text: str, source: str = "unknown") -> nx.DiGraph:
        doc = self.nlp(text)

        for ent in doc.ents:
            embedding = self.embedder.encode(
                ent.text, convert_to_tensor=True
            )
            self.graph.add_node(
                ent.text,
                label=ent.label_,
                embedding=embedding,
                context=ent.sent.text,
                source=source
            )

        for token in doc:
            if token.dep_ in ("nsubj", "dobj", "pobj"):
                head = token.head.text
                child = token.text
                if self.graph.has_node(head) and self.graph.has_node(child):
                    self.graph.add_edge(
                        head, child,
                        relation=token.dep_,
                        weight=1.0
                    )

        return self.graph

    def retrieve(self, query: str, k: int = 5) -> list:
        if len(self.graph.nodes) == 0:
            return []

        q_emb = self.embedder.encode(query, convert_to_tensor=True)
        scores = {}

        for node, data in self.graph.nodes(data=True):
            if "embedding" in data:
                sim = torch.cosine_similarity(
                    q_emb.unsqueeze(0),
                    data["embedding"].unsqueeze(0)
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
                "node": n,
                "score": scores[n],
                "context": " ".join(context_parts),
                "source": self.graph.nodes[n].get("source", "unknown")
            })

        return results