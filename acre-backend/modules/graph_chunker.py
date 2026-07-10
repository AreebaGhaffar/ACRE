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

    def _extract_relation(self, token) -> str:
        """Extract a human-readable relation label from dependency parse."""
        verb = token.head
        if verb.pos_ == "VERB":
            return verb.lemma_.lower()
        return token.dep_

    def chunk(self, text: str, source: str = "unknown") -> nx.DiGraph:
        doc = self.nlp(text)

        # Add entity nodes
        for ent in doc.ents:
            embedding = self.embedder.encode(
                ent.text, convert_to_tensor=True
            )
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

        # Extract meaningful relationships
        for sent in doc.sents:
            sent_ents = [ent for ent in sent.ents]
            for i, ent1 in enumerate(sent_ents):
                for ent2 in sent_ents[i+1:]:
                    # find the verb connecting them
                    relation = self._find_relation(sent, ent1, ent2)
                    if relation and self.graph.has_node(ent1.text) and self.graph.has_node(ent2.text):
                        # avoid duplicate edges
                        if not self.graph.has_edge(ent1.text, ent2.text):
                            self.graph.add_edge(
                                ent1.text, ent2.text,
                                relation=relation,
                                sentence=sent.text.strip(),
                                weight=1.0
                            )

        return self.graph

    def _get_description(self, ent) -> str:
        """Get a short description from the entity's sentence context."""
        sent = ent.sent.text.strip()
        if len(sent) > 120:
            sent = sent[:120] + "..."
        return sent

    def _find_relation(self, sent, ent1, ent2) -> str:
        """Find the verb or relation between two entities in a sentence."""
        # collect token indices for both entities
        ent1_tokens = set(range(ent1.start, ent1.end))
        ent2_tokens = set(range(ent2.start, ent2.end))

        best_verb = None
        min_dist = float('inf')

        for token in sent:
            if token.pos_ in ("VERB", "AUX") and token.dep_ != "aux":
                # check distance to both entities
                dist1 = min(abs(token.i - t) for t in ent1_tokens)
                dist2 = min(abs(token.i - t) for t in ent2_tokens)
                total_dist = dist1 + dist2
                if total_dist < min_dist:
                    min_dist = total_dist
                    best_verb = token.lemma_.lower()

        # fallback to prepositions/conjunctions
        if not best_verb:
            for token in sent:
                if token.dep_ in ("prep", "agent", "relcl"):
                    best_verb = token.text.lower()
                    break

        return best_verb or "related to"

    def get_graph_data(self) -> dict:
        """Return graph data with meaningful relationship labels for frontend."""
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
                "from": u,
                "to": v,
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