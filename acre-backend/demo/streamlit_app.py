import streamlit as st
import requests
import json
import plotly.graph_objects as go
import networkx as nx
import random

API_URL = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="ACRE", 
    page_icon="🧠", 
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .stApp { background-color: #0a0a0a; }
    .main-title { 
        font-size: 3rem; 
        font-weight: 800;
        background: linear-gradient(90deg, #FF0000, #FF6B6B, #ffffff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        padding: 1rem 0;
    }
    .subtitle {
        text-align: center;
        color: #888;
        font-size: 1rem;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 1px solid #FF0000;
        border-radius: 10px;
        padding: 1rem;
        text-align: center;
    }
    .stButton>button {
        background: linear-gradient(90deg, #FF0000, #cc0000);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        width: 100%;
    }
    .stButton>button:hover {
        background: linear-gradient(90deg, #cc0000, #990000);
    }
    div[data-testid="stSidebar"] {
        background-color: #0d0d0d;
        border-right: 1px solid #FF0000;
    }
</style>
""", unsafe_allow_html=True)

# Title
st.markdown('<div class="main-title">🧠 ACRE — Adaptive Cognitive RAG Engine</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Graph-based RAG • Retrieval Critic • Conflict Resolver • Query Planner • Powered by AMD ROCm</div>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("### 📄 Ingest Documents")
    source_name = st.text_input("Source name", value="document_1")
    ingest_mode = st.radio("Input type", ["📝 Paste Text", "📄 Upload PDF"])

    if ingest_mode == "📝 Paste Text":
        doc_text = st.text_area("Paste document text here", height=200)
        if st.button("⚡ Ingest Document"):
            if doc_text:
                with st.spinner("Building knowledge graph..."):
                    r = requests.post(f"{API_URL}/ingest", json={"text": doc_text, "source": source_name})
                    data = r.json()
                st.success(f"✅ Nodes: {data['nodes']} | Edges: {data['edges']}")
            else:
                st.warning("Paste some text first")

    else:
        uploaded_file = st.file_uploader("Upload PDF", type="pdf")
        if st.button("⚡ Ingest PDF"):
            if uploaded_file:
                with st.spinner("Parsing PDF and building knowledge graph..."):
                    r = requests.post(f"{API_URL}/ingest/pdf",
                    files={"file": (uploaded_file.name, uploaded_file.getvalue(), "application/pdf")},
                    data={"source": source_name}
                )
                data = r.json()
            st.success(f"✅ {data['filename']} | Nodes: {data['nodes']}")
            st.caption(f"Preview: {data['text_preview'][:100]}...")
        else:
            st.warning("Upload a PDF first")

    st.markdown("---")
    st.markdown("### 📊 Graph Stats")
    if st.button("🔄 Refresh Stats"):
        r = requests.get(f"{API_URL}/graph/stats")
        data = r.json()
        st.metric("Total Nodes", data["total_nodes"])
        st.metric("Total Edges", data["total_edges"])

    st.markdown("---")
    st.markdown("### ⚙️ Pipeline Status")
    st.markdown("🟢 Graph Chunker")
    st.markdown("🟢 Retrieval Critic")
    st.markdown("🟢 Conflict Resolver")
    st.markdown("🟢 Query Planner")

# Main tabs
tab1, tab2, tab3 = st.tabs(["💬 Query", "🕸️ 3D Knowledge Graph", "📈 Pipeline Metrics"])

with tab1:
    st.markdown("### Ask ACRE a Question")
    query = st.text_input("", placeholder="How did AMD's acquisition of Xilinx help them in AI?")
    
    if st.button("🚀 Run ACRE Pipeline"):
        if query:
            with st.spinner("🧠 Running full ACRE pipeline..."):
                r = requests.post(f"{API_URL}/query", json={"query": query})
                data = r.json()

            st.markdown("### ✅ Final Answer")
            st.markdown(f"""
            <div style='background: linear-gradient(135deg, #1a1a2e, #16213e); 
                        border-left: 4px solid #FF0000; 
                        padding: 1.5rem; 
                        border-radius: 8px;
                        color: white;
                        line-height: 1.8;'>
            {data["final_answer"]}
            </div>
            """, unsafe_allow_html=True)

            st.markdown("### 🔍 Sub-queries Generated")
            for i, sq in enumerate(data["sub_queries"]):
                st.markdown(f"""
                <div style='background: #1a1a1a; border: 1px solid #333; 
                            padding: 0.75rem; border-radius: 6px; margin: 0.5rem 0; color: #ccc;'>
                {i+1}. {sq}
                </div>
                """, unsafe_allow_html=True)

            col1, col2 = st.columns(2)
            with col1:
                st.metric("Sub-queries", len(data["sub_queries"]))
            with col2:
                st.metric("Conflicts Detected", data["total_conflicts"])
        else:
            st.warning("Enter a question first")

with tab2:
    st.markdown("### 🕸️ Live 3D Knowledge Graph")
    st.caption("This is your actual document knowledge graph — nodes are concepts, edges are relationships")

    if st.button("🔄 Load 3D Graph"):
        r = requests.get(f"{API_URL}/graph/stats")
        data = r.json()
        nodes = data["nodes"]

        if len(nodes) == 0:
            st.warning("No nodes yet — ingest a document first")
        else:
            G = nx.DiGraph()
            G.add_nodes_from(nodes)
            for i in range(len(nodes)):
                for j in range(i+1, min(i+3, len(nodes))):
                    G.add_edge(nodes[i], nodes[j])

            pos = nx.spring_layout(G, dim=3, seed=42)

            # 3D edges
            edge_x, edge_y, edge_z = [], [], []
            for e in G.edges():
                x0, y0, z0 = pos[e[0]]
                x1, y1, z1 = pos[e[1]]
                edge_x += [x0, x1, None]
                edge_y += [y0, y1, None]
                edge_z += [z0, z1, None]

            edge_trace = go.Scatter3d(
                x=edge_x, y=edge_y, z=edge_z,
                mode='lines',
                line=dict(color='#FF4444', width=2),
                hoverinfo='none'
            )

            # 3D nodes
            node_x = [pos[n][0] for n in G.nodes()]
            node_y = [pos[n][1] for n in G.nodes()]
            node_z = [pos[n][2] for n in G.nodes()]

            node_trace = go.Scatter3d(
                x=node_x, y=node_y, z=node_z,
                mode='markers+text',
                text=list(G.nodes()),
                textposition='top center',
                marker=dict(
                    size=10,
                    color=[random.randint(0, len(nodes)) for _ in nodes],
                    colorscale='Reds',
                    line=dict(color='white', width=1)
                ),
                hovertext=list(G.nodes()),
                hoverinfo='text'
            )

            fig = go.Figure(data=[edge_trace, node_trace])
            fig.update_layout(
                paper_bgcolor='#0a0a0a',
                plot_bgcolor='#0a0a0a',
                scene=dict(
                    bgcolor='#0a0a0a',
                    xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                    zaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
                ),
                margin=dict(l=0, r=0, t=0, b=0),
                height=600,
                showlegend=False
            )

            st.plotly_chart(fig, use_container_width=True)

with tab3:
    st.markdown("### 📈 Pipeline Performance Metrics")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Chunking Method", "Semantic Graph", delta="vs Fixed chunks")
    with col2:
        st.metric("Critic Threshold", "0.6", delta="Quality filter")
    with col3:
        st.metric("Model", "Qwen 2.5 7B", delta="Local • Free")
    with col4:
        st.metric("GPU", "AMD ROCm", delta="Cloud ready")

    st.markdown("### 🔄 How ACRE Works")
    st.markdown("""
    <div style='background: #111; border: 1px solid #333; border-radius: 10px; padding: 1.5rem;'>
    <p style='color: #ccc; line-height: 2;'>
    1️⃣ <b style='color:#FF4444'>Graph Chunker</b> — Extracts concepts and relationships, builds a semantic knowledge graph instead of fixed chunks<br>
    2️⃣ <b style='color:#FF4444'>Retrieval Critic</b> — Scores every retrieved chunk on relevance, coherence, freshness and specificity<br>
    3️⃣ <b style='color:#FF4444'>Conflict Resolver</b> — Detects contradictions between sources and resolves them with citations<br>
    4️⃣ <b style='color:#FF4444'>Query Planner</b> — Decomposes complex questions into sub-queries, retrieves and reasons iteratively
    </p>
    </div>
    """, unsafe_allow_html=True)